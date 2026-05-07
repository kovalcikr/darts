# AGENTS.md

## Code standards:
- when writing or modifiing code ALWAYS use Test-driven development
- keep scope of changes minimal unless explicitly told other
- when writing or modifiing code ALWAYS use SOLID principles: Single responsibility, Open–closed, Liskov substitution, Interface segregation, Dependency inversion
- NEVER commit witout explcit ask
- NEVER push to git witout explicit ask
- NEVER modify production database witout explicit ask

### Test-driven development

Test-driven development (TDD) is a way of writing code that involves writing an automated unit-level test case that fails, then writing just enough code to make the test pass, then refactoring both the test code and the production code, then repeating with another new test case.

Alternative approaches to writing automated tests is to write all of the production code before starting on the test code or to write all of the test code before starting on the production code. With TDD, both are written together, therefore shortening debugging time necessities.

#### Coding cycle
1. List scenarios for the new feature
    List the expected variants in the new behavior. "There's the basic case & then what-if this service times out & what-if the key isn't in the database yet &…" The developer can discover these specifications by asking about use cases and user stories. A key benefit of TDD is that it makes the developer focus on requirements before writing code. This is in contrast with the usual practice, where unit tests are only written after code.
2. Write a test for an item on the list
    Write an automated test that would pass if the variant in the new behavior is met.
3. Run all tests. The new test should fail – for expected reasons
    This shows that new code is actually needed for the desired feature. It validates that the test harness is working correctly. It rules out the possibility that the new test is flawed and will always pass.
4. Write the simplest code that passes the new test
    Inelegant code and hard coding is acceptable. The code will be honed in Step 6. No code should be added beyond the tested functionality.
5. All tests should now pass
    If any fail, fix failing tests with minimal changes until all pass.
6. Refactor as needed while ensuring all tests continue to pass
    Code is refactored for readability and maintainability. In particular, hard-coded test data should be removed from the production code. Running the test suite after each refactor ensures that no existing functionality is broken. Examples of refactoring:

        moving code to where it most logically belongs
        removing duplicate code
        making names self-documenting
        splitting methods into smaller pieces
        re-arranging inheritance hierarchies

Repeat
    Repeat the process, starting at step 2, with each test on the list until all tests are implemented and passing.

When using external libraries, it is important not to write tests that are so small as to effectively test merely the library itself, unless there is some reason to believe that the library is buggy or not feature-rich enough to serve all the needs of the software under development. 

### SOLID principles:
In object-oriented programming, SOLID is a mnemonic acronym for five principles intended to make source code more understandable, flexible, and maintainable. Although the principles apply to object-oriented programming, they can also form a core philosophy for methodologies such as agile software development and adaptive software development.

#### Single responsibility principle

The single-responsibility principle (SRP) states that there should never be more than one reason for a class to change. In other words, every class should have only one responsibility.

Importance:

    Maintainability: When classes have a single, well-defined responsibility, they're easier to understand and modify.
    Testability: It's easier to write unit tests for classes with a single focus.
    Flexibility: Changes to one responsibility don't affect unrelated parts of the system.

#### Open–closed principle

The open–closed principle (OCP) states that software entities should be open for extension, but closed for modification.

Importance:

    Extensibility: New features can be added without modifying existing code.
    Stability: Reduces the risk of introducing bugs when making changes.
    Flexibility: Adapts to changing requirements more easily.

#### Liskov substitution principle

The Liskov substitution principle (LSP) states that functions that use pointers or references to base classes must be able to use pointers or references of derived classes without knowing it. See also design by contract.

Importance:

    Polymorphism: Enables the use of polymorphic behavior, making code more flexible and reusable.
    Reliability: Ensures that subclasses adhere to the contract defined by the superclass.
    Predictability: Guarantees that replacing a superclass object with a subclass object won't break the program.

#### Interface segregation principle

The interface segregation principle (ISP) states that clients should not be forced to depend upon interface methods that they do not use.

Importance:

    Decoupling: Reduces dependencies between classes, making the code more modular and maintainable.
    Flexibility: Allows for more targeted implementations of interfaces.
    Avoids unnecessary dependencies: Clients don't have to depend on methods they don't use.

#### Dependency inversion principle

The dependency inversion principle (DIP) states to depend upon abstractions, not concretes.

Importance:

    Loose coupling: Reduces dependencies between modules, making the code more flexible and easier to test.
    Flexibility: Enables changes to implementations without affecting clients.
    Maintainability: Makes code easier to understand and modify.

## Development Commands

- **Dev server**: `npm run dev` (requires `.env.development.local` with POSTGRES_PRISMA_URL)
- **Unit tests**: `npm test` (runs Jest with dotenv -e .env.test)
- **Lint**: `npm run lint` (ESLint with Next.js recommended rules)
- **Build**: `npm run build` (runs prisma:generate before Next.js build)

## Test Commands

- **Playwright UI tests**: `npm run test:ui` (starts dev:playwright automatically)
- **Playwright E2E tests**: `npm run test:ui:e2e` (runs `run-playwright-e2e-tests.sh`)
- **Integration tests**: `npm run test:integration` (requires PostgreSQL, uses `NODE_OPTIONS=--experimental-vm-modules`)
- **Single unit test**: `npx dotenv -e .env.test -- npx jest -t "test name"`
- **Integration tests with script**: `sh run-integration-tests.sh` (starts Docker PostgreSQL)

## Database

- **Prisma client** generated to `prisma/generated/client` (ESM format)
- **Migrations**: `npm run migrate` (development) or `npm run migrate:test` (test)
- **Prisma Studio**: `npm run studio`

## Architecture

- **Type**: Next.js 16 App Router project
- **Database**: PostgreSQL via Prisma
- **Import alias**: `@/` maps to project root
- **Node**: Requires >=22 <25

## Environment

- `.env.development.local` required for dev
- `.env.test` auto-created from `.env.example` if missing
- `CUESCORE_PROVIDER=fake` enables local fake provider in development

## Code Generation

- **Prisma client**: Auto-generated on build and pretest
- Always commit `prisma/generated/client` (generated, not vendored)

## Common Gotchas

- Run `prisma generate` after schema changes before importing PrismaClient
- Integration tests require experimental-vm-modules flag
- ESLint ignores `prisma/generated/**` - don't edit generated files

## Functional Scope

**Darts Tournament Management System** for Relax Darts Cup:

### Core Features
- **Live Scoring (`/tables/[table]`)**: Tablet-optimized num-pad interface for real-time score entry, undo/redo, checkout dart selection (1-3 darts), 20s auto-refresh
- **Dashboard (`/dashboard`)**: 6-table grid showing live scores, player photos, averages, last throws
- **Statistics**: Season-based player rankings, tournament summaries, match details with throw-by-throw breakdown
- **Admin (`/admin`)**: Tournament CRUD via CueScore ID, set active tournament, include/exclude from global stats, password auth

### Key Workflows
- Scorekeeper: Navigate to `/tables/[table]` → auto-refresh → select starter → enter scores via num-pad → select checkout darts → finish match
- Admin: Login → create/open tournament by CueScore ID → set as active → monitor via `/dashboard`
