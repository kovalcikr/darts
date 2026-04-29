import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');

function getModelBlock(modelName: string) {
  const match = schema.match(new RegExp(`model ${modelName} \\{[\\s\\S]*?\\n\\}`));
  if (!match) {
    throw new Error(`Could not find model ${modelName} in Prisma schema`);
  }

  return match[0];
}

describe('Prisma scoreboard and dashboard indexes', () => {
  const playerThrowModel = getModelBlock('PlayerThrow');
  const matchModel = getModelBlock('Match');
  const matchLiveStateModel = getModelBlock('MatchLiveState');
  const appSettingModel = getModelBlock('AppSetting');

  test('keeps the active-leg scoring index for current score aggregation', () => {
    expect(playerThrowModel).toContain('@@index([matchId, leg, playerId])');
  });

  test('indexes dashboard match averages by match and player', () => {
    expect(playerThrowModel).toContain('@@index([matchId, playerId])');
  });

  test('indexes recent throw lookups by match, leg, and time', () => {
    expect(playerThrowModel).toContain('@@index([matchId, leg, time])');
  });

  test('does not add stats-first indexes to the live scoring table', () => {
    expect(playerThrowModel).not.toContain('@@index([tournamentId, playerId])');
    expect(playerThrowModel).not.toContain('@@index([tournamentId, checkout, score])');
  });

  test('defines a live match projection for dashboard polling', () => {
    expect(matchModel).toContain('liveState      MatchLiveState?');
    expect(matchLiveStateModel).toContain('matchId           String   @id');
    expect(matchLiveStateModel).toContain('playerAScoreLeft  Int      @default(501)');
    expect(matchLiveStateModel).toContain('playerBScoreLeft  Int      @default(501)');
    expect(matchLiveStateModel).toContain('lastThrows        Json     @default("[]")');
    expect(matchLiveStateModel).toContain('@@index([tournamentId, table])');
  });

  test('defines a singleton app setting store for active tournament state', () => {
    expect(appSettingModel).toContain('key       String   @id');
    expect(appSettingModel).toContain('value     String?');
    expect(appSettingModel).toContain('updatedAt DateTime @updatedAt');
  });
});
