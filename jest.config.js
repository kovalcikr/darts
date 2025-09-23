const integrationConfig = require('./jest.integration.config.js');
const unitConfig = require('./jest.unit.config.js');

const jestEnv = process.env.JEST_ENV;

let config;

if (jestEnv === 'integration') {
  config = integrationConfig;
} else {
  config = unitConfig;
}

module.exports = config;
