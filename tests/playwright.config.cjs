'use strict'
/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  globalSetup: require.resolve('./global-setup.cjs'),
  use: {
    baseURL:      'http://localhost:3000',
    storageState: '/home/manivel/project/valamhq/test-results/auth-state.json',
    headless:     true,
    viewport:     { width: 1280, height: 900 },
  },
  testMatch:  ['**/valam_audit.spec.js'],
  reporter:   [['list']],
  timeout:    45000,
  workers:    1,
  outputDir:  '/home/manivel/project/valamhq/test-results/.playwright',
}
