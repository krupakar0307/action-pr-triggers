// Mock data - set to success for green base branch
const mockBaseBranchSha = '5c1c9c10ed0763037bfcd936fbd166fb32698341';
const mockCheckRuns = [
  { name: 'Test 1', conclusion: 'success', status: 'completed' }
];
const mockStatuses = [
  { context: 'ci/jenkins', state: 'success' }
];

// To test a red base branch, uncomment this:
/*
const mockCheckRuns = [
  { name: 'Test 1', conclusion: 'failure', status: 'completed' }
];
*/

// Override core functions
const core = require('@actions/core');
core.getInput = function(name) {
  if (name === 'github-token') return 'mock-token';
  if (name === 'base-branch') return 'main'; // Explicitly set to 'main'
  return '';
};

core.setFailed = function(message) {
  console.error(`FAILED: ${message}`);
};

core.info = function(message) {
  console.log(`INFO: ${message}`);
};

// Mock GitHub API
const github = require('@actions/github');
github.getOctokit = function() {
  return {
    rest: {
      git: {
        getRef: async () => ({
          data: { object: { sha: mockBaseBranchSha } }
        })
      },
      repos: {
        getCombinedStatusForRef: async () => ({
          data: { 
            state: 'success',
            statuses: mockStatuses
          }
        })
      },
      checks: {
        listForRef: async () => ({
          data: { check_runs: mockCheckRuns }
        })
      }
    }
  };
};

// Mock GitHub context
github.context = {
  repo: {
    owner: 'mock-owner',
    repo: 'mock-repo'
  }
};

// Run the action
try {
  require('./index.js');
} catch (error) {
  console.error('Error running action:', error);
} 