# Darts - Tournament Management and Scoring System

## Application Overview

Darts is a comprehensive **darts tournament management and scoring platform** designed for the "Relax Darts Cup" league. The application provides real-time score tracking, player statistics, tournament administration, and integration with external darts platforms.

## User-Facing Features

### 1. Public Statistics & Overview

**Homepage (`/`)** - Season Overview
- Displays aggregate statistics for the selected season
- Shows total players, tournaments, matches, and legs played
- Tracks total darts thrown and 180s scored
- Highlights best averages, checkouts, and best legs with player names

**Players Directory (`/players`)**
- Ranked list of all registered players
- Click through to individual player profiles
- Shows participation across tournaments

**Player Profile (`/players/[id]`)**
- Comprehensive player statistics including:
  - Tournament participation count
  - Match and leg win rates
  - Best checkout, highest score, and best leg
  - Average performance breakdown by ranges (45+, 50+, 55+, etc.)
  - High score distribution (80+, 100+, 133+, 171+, 180s)
  - Checkout statistics by difficulty levels
  - Best legs by dart count (13-15, 16-18, etc.)
- Most frequent opponents identified

**Tournament List (`/stats/tournaments`)**
- Browse all tournaments for a season
- Filter by season year
- Overview of tournament count and activity

**Tournament Detail (`/stats/tournaments/[id]`)**
- Medal winners display (1st, 2nd, 3rd place with medal icons)
- Best checkouts, high scores, and best legs
- Match averages table ranking players
- Complete match list with results and links to match details
- Tables showing:
  - Best checkouts by player
  - High scores by player
  - Best legs by player
  - Match averages by player

**Match Detail (`/tournaments/[id]/match/[matchId]`)**
- Detailed match breakdown with:
  - Both players' stats (average, highest score, best checkout, best leg)
  - Visual throw-by-throw breakdown organized by leg
  - Color-coded leg winners (player A vs player B)
  - Remaining score visualization for each throw

---

### 2. Tablet Mode - Live Scoring (`/tables/[table]`)

A touch-optimized interface for scoring matches in real-time:

**Match Entry**
- Num-pad interface for entering dart scores (1-20, 25, 50)
- Score validation (max 180 per throw, cannot bust)
- Large display showing remaining score and current player

**Player Display**
- Player cards showing names, current scores, leg counts, and match averages
- Visual indicator of which player starts each leg
- Active player highlighted with accent ring

**Game Controls**
- UNDO/REDO functionality for correcting mistakes
- CLR button to clear current input
- Backspace to remove last digit
- Auto-refresh while waiting for a match to start (every 20 seconds)

**Checkout Handling**
- When reaching zero, player selects checkout darts (1, 2, or 3)
- Only valid checkout options are enabled based on remaining score
- The finishing dart must land on a double or bullseye (double-out rule)
- OK button records the checkout with dart count

---

### 3. Dashboard (`/dashboard`)

Real-time overview of all active table matches:

**Grid Layout**
- 6 tables displayed in a 2x3 grid
- Each table shows current match status

**Live Information Per Table**
- Current players with photos
- Live scores and leg counts
- Current throw averages
- Last throws history
- Visual indicator of whose turn it is

---

### 4. Tournament Admin (`/admin`)

Secured administrative interface with login:

**Tournament Management**
- View all tournaments with search filtering
- Create tournaments from CueScore ID
- Set active tournament for fixed URLs (`/tables`, `/dashboard`)
- Edit tournament details (name, season, date)
- Toggle inclusion in global statistics
- Delete tournaments (with confirmation)

**Match Management**
- View all matches within a tournament
- Drill down to edit individual matches
- Inspect and edit throw records

---

## User Workflows

### Tournament Director/Organizer
1. Login to admin panel
2. Create or open tournament by entering CueScore ID
3. Set tournament as "active" for fixed URL access
4. Monitor dashboard during event for live match tracking
5. Review statistics after tournament concludes

### Referee/Scorekeeper
1. Navigate to `/tables/[table]` on tablet device
2. Wait for match to appear (auto-refreshes every 20 seconds)
3. Select starting player when match begins
4. Enter dart scores using num-pad interface
5. Select checkout darts (1-3) when finishing a leg
6. Use UNDO/REDO to correct mistakes
7. Complete match when all legs are won

### Spectator/Stats Follower
1. Visit homepage to see season overview
2. Browse player rankings to see standings
3. Click player names to see detailed profiles
4. Browse tournaments and view match results
5. Watch dashboard during live events

---

## Technical Notes

- **Season-based organization**: Statistics scoped to specific seasons (e.g., 2026)
- **CueScore integration**: Matches fetched from external CueScore platform
- **Slovak language**: UI text in Slovak (e.g., "Celkové štatistiky" = "Overall statistics")
- **Responsive design**: Works on desktop, tablet, and mobile devices