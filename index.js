import * as core from '@actions/core';
import * as github from '@actions/github';
import axios from 'axios';

async function run() {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const repo = process.env.GITHUB_REPOSITORY;
    let baseBranch = core.getInput('base-branch') || 'main';

    if (!token || !repo) {
      core.setFailed('Missing required environment variables: GITHUB_TOKEN or GITHUB_REPOSITORY');
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };

    core.info(`Checking workflow runs for ${baseBranch} branch...`);

    // Fetch the latest completed workflow runs for the base branch
    const url = `https://api.github.com/repos/${repo}/actions/runs?branch=${baseBranch}&status=completed`;
    const response = await axios.get(url, { headers });
    const runs = response.data.workflow_runs;

    if (!runs || runs.length === 0) {
      core.setFailed(`No workflow runs found for ${baseBranch} branch`);
      return;
    }

    // Get the most recent completed run
    const latestRun = runs[0];
    core.info(`Latest workflow run details:`);
    core.info(`  Name: ${latestRun.name}`);
    core.info(`  Status: ${latestRun.status}`);
    core.info(`  Conclusion: ${latestRun.conclusion}`);
    core.info(`  Created at: ${latestRun.created_at}`);

    const isGreen = latestRun.conclusion === 'success';
    core.info(`Main branch status: ${isGreen ? 'GREEN' : 'RED'}`);
    core.setOutput('is-main-green', isGreen.toString());

    if (!isGreen) {
      core.setFailed(`⛔ Cannot proceed: ${baseBranch} branch is RED`);
    }
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();