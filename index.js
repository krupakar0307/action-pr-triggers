const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // Ensure the action is triggered by a push to the base branch
    if (github.context.eventName !== 'push') {
      core.setFailed('This action is designed to run only on push events.');
      return;
    }

    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const baseBranch = core.getInput('base-branch', { required: false }) || 'main';
    
    // Create octokit client
    const octokit = github.getOctokit(token);
    const context = github.context;
    
    core.info(`Checking status of ${baseBranch} branch...`);
    
    // Get repository information
    const owner = context.repo.owner;
    const repo = context.repo.repo;
    
    // Get the latest commit on the base branch
    const { data: baseBranchRef } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`
    });
    
    const baseBranchSha = baseBranchRef.object.sha;
    
    // Get the combined status for the base branch
    const { data: statusData } = await octokit.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref: baseBranchSha
    });

    // Check if base branch status is success
    if (statusData.state === 'success') {
      core.info(`✅ ${baseBranch} branch is GREEN`);
    } else {
      core.setFailed(`⛔ Cannot proceed: ${baseBranch} branch is RED (status: ${statusData.state})`);
    }
    
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run(); 