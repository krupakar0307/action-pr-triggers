import * as core from '@actions/core';
import axios from 'axios';

async function run() {
  try {
    // Get environment variables
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPOSITORY;
    const baseBranch = process.env.BASE_BRANCH || 'main';

    if (!token || !repo) {
      core.setFailed('Missing required environment variables: GITHUB_TOKEN or GITHUB_REPOSITORY');
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };

    core.info(`Checking if base branch '${baseBranch}' exists...`);
    const baseBranchUrl = `https://api.github.com/repos/${repo}/actions/runs?branch=${baseBranch}`;
    const baseBranchResponse = await axios.get(baseBranchUrl, { headers });

    if (baseBranchResponse.status !== 200 || !baseBranchResponse.data.workflow_runs.length) {
      core.setFailed(`Base branch '${baseBranch}' not found or has no workflows`);
      return;
    }

    core.info(`Fetching all open PRs...`);
    const prUrl = `https://api.github.com/repos/${repo}/pulls?state=open`;
    const prResponse = await axios.get(prUrl, { headers });

    if (prResponse.status !== 200) {
      core.setFailed(`Error fetching PRs: ${prResponse.data}`);
      return;
    }

    const prs = prResponse.data;
    if (!prs.length) {
      core.info('No open PRs found.');
      return;
    }

    core.info(`Found ${prs.length} open PRs. Triggering their workflows...`);

    for (const pr of prs) {
      const prBranch = pr.head.ref;
      const prNumber = pr.number;

      // Get latest workflow run for this PR
      const workflowUrl = `https://api.github.com/repos/${repo}/actions/runs?branch=${prBranch}`;
      const workflowResponse = await axios.get(workflowUrl, { headers });

      if (workflowResponse.status !== 200) {
        core.warning(`Error fetching workflows for PR #${prNumber}`);
        continue;
      }

      const runs = workflowResponse.data.workflow_runs;
      if (!runs.length) {
        core.info(`No workflows found for PR #${prNumber}`);
        continue;
      }

      // Trigger rerun of the latest workflow
      const runId = runs[0].id;
      const rerunUrl = `https://api.github.com/repos/${repo}/actions/runs/${runId}/rerun`;
      const rerunResponse = await axios.post(rerunUrl, {}, { headers });

      if (rerunResponse.status === 201) {
        core.info(`✅ Triggered workflow rerun for PR #${prNumber} (${prBranch})`);
      } else {
        core.warning(`❌ Failed to trigger workflow for PR #${prNumber} (${prBranch})`);
      }
    }
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();