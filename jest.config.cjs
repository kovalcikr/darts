const integrationConfig = require('./jest.integration.config.cjs');
const unitConfig = require('./jest.unit.config.cjs');

const jestEnv = process.env.JEST_ENV;

let config;

if (jestEnv === 'integration') {
  config = integrationConfig;
} else {
  config = unitConfig;
}

module.exports = config;
