const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const baseBranch = core.getInput('base-branch', { required: false }) || 'main';
    
    // Create octokit client
    const octokit = github.getOctokit(token);
    const context = github.context;
    
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
    
    // Get check runs for the base branch
    const { data: checkRunsData } = await octokit.rest.checks.listForRef({
      owner,
      repo,
      ref: baseBranchSha
    });
    
    // Get statuses for the base branch
    const { data: statusData } = await octokit.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref: baseBranchSha
    });
    
    // Check for any failed checks
    const failedChecks = checkRunsData.check_runs.filter(
      check => check.conclusion === 'failure' || check.conclusion === 'cancelled' || check.conclusion === 'timed_out'
    );
    
    const failedStatuses = statusData.statuses.filter(
      status => status.state === 'failure' || status.state === 'error'
    );
    
    // If there are any failed checks or statuses, the base branch is red
    if (failedChecks.length > 0 || failedStatuses.length > 0) {
      core.setFailed(`⛔ BLOCKED: ${baseBranch} branch has failed checks. Fix the ${baseBranch} branch before merging this PR.`);
      return;
    }
    
    // If we get here, there are no failed checks, so the branch is considered green
    core.info(`✅ ${baseBranch} branch is green. PR can proceed.`);
    
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run(); 