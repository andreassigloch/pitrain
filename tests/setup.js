/**
 * Jest Test Setup
 * Author: andreas@siglochconsulting.com
 */

require('dotenv').config();

// Global test configuration
global.console = {
  ...console,
  // Suppress noise during tests unless DEBUG=1
  log: process.env.DEBUG ? console.log : jest.fn(),
  debug: process.env.DEBUG ? console.debug : jest.fn(),
  info: process.env.DEBUG ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.PORT = '3001';

// Ensure API key is available for tests (use dummy key if not configured)
if (!process.env.MISTRAL_API_KEY) {
  process.env.MISTRAL_API_KEY = 'test-api-key-for-unit-tests';
}

// Extend Jest timeout for integration tests
jest.setTimeout(60000);