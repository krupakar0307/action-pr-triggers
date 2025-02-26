const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const mainBranch = core.getInput('main-branch', { required: false }) || 'main';
    
    // Create octokit client
    const octokit = github.getOctokit(token);
    const context = github.context;
    
    core.info(`Checking status of ${mainBranch} branch...`);
    
    // Get repository information
    const owner = context.repo.owner;
    const repo = context.repo.repo;
    
    // Get the latest commit on the main branch
    const { data: mainBranchRef } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${mainBranch}`
    });
    
    const mainBranchSha = mainBranchRef.object.sha;
    
    // Get the combined status for the main branch
    const { data: statusData } = await octokit.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref: mainBranchSha
    });

    // Simply check if main branch status is success
    if (statusData.state !== 'success') {
      core.setFailed(`⛔ Cannot proceed: ${mainBranch} branch is RED (status: ${statusData.state})`);
      return;
    }
    
    core.info(`✅ ${mainBranch} branch is GREEN`);
    
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run(); 