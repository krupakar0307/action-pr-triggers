// Set environment variables
process.env.INPUT_GITHUB_TOKEN = 'your-github-token';
process.env.INPUT_MAIN_BRANCH = 'main';
process.env.GITHUB_REPOSITORY = 'your-username/your-repo';

// Mock core module for local testing
const originalCore = require('@actions/core');
const core = {
  ...originalCore,
  info: (message) => console.log(`[INFO] ${message}`),
  warning: (message) => console.log(`[WARNING] ${message}`),
  error: (message) => console.log(`[ERROR] ${message}`),
  debug: (message) => console.log(`[DEBUG] ${message}`),
  setFailed: (message) => {
    console.log(`[FAILED] ${message}`);
    process.exit(1);
  },
  getInput: (name, options) => {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
      throw new Error(`Input required and not supplied: ${name}`);
    }
    return val;
  }
};

// Replace the core module with our mock
jest.mock('@actions/core', () => core);

// Run the action
require('./index.js'); 