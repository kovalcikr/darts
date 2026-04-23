import { Client } from 'pg';

type CliArgs = {
  tournamentId?: string;
  confirmId?: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const positional: string[] = [];
  let dryRun = false;

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    positional.push(arg);
  }

  return {
    tournamentId: positional[0],
    confirmId: positional[1],
    dryRun,
  };
}

async function main() {
  const { tournamentId, confirmId, dryRun } = parseArgs(process.argv.slice(2));
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL;

  if (!tournamentId) {
    console.error('Usage: npm run delete:tournament -- <tournament-id> <confirm-tournament-id> [--dry-run]');
    process.exit(1);
  }

  if (!dryRun && confirmId !== tournamentId) {
    console.error(`Refusing to delete tournament ${tournamentId} without a matching confirmation ID.`);
    console.error(`Run: npm run delete:tournament -- ${tournamentId} ${tournamentId}`);
    process.exit(1);
  }

  if (!connectionString) {
    console.error('POSTGRES_URL_NON_POOLING or POSTGRES_PRISMA_URL is not set. Load the target environment before running this script.');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    const tournamentResult = await client.query<{
      id: string;
      name: string;
      match_count: string | number;
      player_throw_count: string | number;
    }>(
      `select
         t.id,
         t.name,
         (select count(*) from "Match" m where m."tournamentId" = t.id) as match_count,
         (select count(*) from "PlayerThrow" pt where pt."tournamentId" = t.id) as player_throw_count
       from "Tournament" t
       where t.id = $1`,
      [tournamentId]
    );

    const tournament = tournamentResult.rows[0];

    if (!tournament) {
      console.error(`Tournament ${tournamentId} was not found.`);
      process.exit(1);
    }

    const matchCount = Number(tournament.match_count);
    const playerThrowCount = Number(tournament.player_throw_count);

    console.log(
      `Tournament ${tournamentId} (${tournament.name}) will remove ${matchCount} matches and ${playerThrowCount} throws.`
    );

    if (dryRun) {
      console.log('Dry run complete. No data was deleted.');
      return;
    }

    await client.query('begin');
    const deletedThrows = await client.query(
      'delete from "PlayerThrow" where "tournamentId" = $1',
      [tournamentId]
    );
    const deletedMatches = await client.query(
      'delete from "Match" where "tournamentId" = $1',
      [tournamentId]
    );
    const deletedTournaments = await client.query(
      'delete from "Tournament" where id = $1',
      [tournamentId]
    );
    await client.query('commit');

    console.log(
      `Successfully deleted tournament ${tournamentId}. Deleted ${deletedTournaments.rowCount ?? 0} tournament rows, ${deletedMatches.rowCount ?? 0} matches, and ${deletedThrows.rowCount ?? 0} throws.`
    );
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    console.error(`An error occurred while deleting tournament ${tournamentId}:`, error);
    process.exit(1);
  } finally {
    await client.end().catch(() => undefined);
  }
}

main();
