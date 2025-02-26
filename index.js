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
    core.info(`Main branch SHA: ${mainBranchSha}`);
    
    // Get the combined status for the latest commit on main
    const { data: statusData } = await octokit.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref: mainBranchSha
    });
    
    core.info(`Main branch status: ${statusData.state}`);
    
    // Check if main branch is green (success)
    if (statusData.state !== 'success') {
      core.setFailed(`Cannot proceed with PR because ${mainBranch} branch is not in a successful state (current state: ${statusData.state})`);
      return;
    }
    
    // Also check for any pending or failed required checks
    const { data: checkRuns } = await octokit.rest.checks.listForRef({
      owner,
      repo,
      ref: mainBranchSha
    });
    
    const failedOrPendingChecks = checkRuns.check_runs.filter(
      check => check.conclusion !== 'success' && check.conclusion !== 'skipped' && check.conclusion !== null
    );
    
    if (failedOrPendingChecks.length > 0) {
      const checkNames = failedOrPendingChecks.map(check => check.name).join(', ');
      core.setFailed(`Cannot proceed with PR because ${mainBranch} branch has failed or pending checks: ${checkNames}`);
      return;
    }
    
    core.info(`${mainBranch} branch is green! PR can proceed.`);
    
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run(); 