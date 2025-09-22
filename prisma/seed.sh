#!/bin/sh
set -e

npx dotenv -e .env.test -- tsc --project tsconfig.seed.json
npx dotenv -e .env.test -- node dist/prisma/seed.js
