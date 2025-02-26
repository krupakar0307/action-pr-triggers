import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  try {
    // Ensure the action is triggered by a pull request
    if (github.context.eventName !== 'pull_request') {
      core.setFailed('This action is designed to run only on pull requests.');
      return;
    }

    // Get inputs
    const token = core.getInput('github-token', { required: true });
    let branch = core.getInput('branch');
    if (!branch) {
      branch = 'main';
    }
    
    // Create octokit client
    const octokit = github.getOctokit(token);
    const context = github.context;
    
    core.info(`Checking status of ${branch} branch...`);
    
    // Get repository information
    const owner = context.repo.owner;
    const repo = context.repo.repo;
    
    // Get the latest commit on the specified branch
    const { data: branchRef } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`
    });
    
    const branchSha = branchRef.object.sha;
    
    // Get the combined status for the latest commit on the specified branch
    const { data: statusData } = await octokit.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref: branchSha
    });

    // Check if there are any statuses
    if (statusData.statuses.length === 0) {
      core.setFailed(`⛔ Cannot proceed: No status checks found on the latest commit of ${branch} branch.`);
      return;
    }

    // Check if the branch status is success
    if (statusData.state === 'success') {
      core.info(`✅ ${branch} branch is GREEN`);
    } else {
      core.setFailed(`⛔ Cannot proceed: ${branch} branch is RED (status: ${statusData.state})`);
    }
    
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();