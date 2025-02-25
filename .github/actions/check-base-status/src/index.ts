import * as core from '@actions/core';
import * as github from '@actions/github';

async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const baseBranch = core.getInput('base-branch', { required: true });
    
    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    console.log(`🔍 Checking status for ${owner}/${repo}:${baseBranch}`);

    // Get the latest commit on base branch
    const { data: baseRef } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch: baseBranch,
    });

    const sha = baseRef.commit.sha;
    console.log(`\n📌 Latest commit on ${baseBranch}: ${sha.substring(0, 7)}`);

    // Get both status checks and check runs
    const [statusRes, checksRes] = await Promise.all([
      octokit.rest.repos.getCombinedStatusForRef({
        owner,
        repo,
        ref: sha,
      }),
      octokit.rest.checks.listForRef({
        owner,
        repo,
        ref: sha,
      })
    ]);

    // Analyze status checks
    console.log('\n📊 Status Checks:');
    console.log(`Overall Status: ${statusRes.data.state.toUpperCase()}`);
    
    if (statusRes.data.statuses.length === 0) {
      console.log('No status checks found');
    } else {
      statusRes.data.statuses.forEach(status => {
        const emoji = status.state === 'success' ? '✅' : status.state === 'failure' ? '❌' : '⏳';
        console.log(`${emoji} ${status.context}: ${status.state}`);
      });
    }

    // Analyze check runs
    console.log('\n🔍 Check Runs:');
    if (checksRes.data.check_runs.length === 0) {
      console.log('No check runs found');
    } else {
      checksRes.data.check_runs.forEach(check => {
        const status = check.conclusion || check.status;
        const emoji = status === 'success' ? '✅' : status === 'failure' ? '❌' : '⏳';
        console.log(`${emoji} ${check.name}: ${status}`);
      });
    }

    // Add debug logging
    console.log('\n🔍 Debug Information:');
    console.log(`Status Checks Count: ${statusRes.data.statuses.length}`);
    console.log(`Status State: ${statusRes.data.state}`);
    console.log(`Total Check Runs: ${checksRes.data.check_runs.length}`);
    
    // Log each check run's details
    checksRes.data.check_runs.forEach(check => {
      console.log(`Check Run "${check.name}":`, {
        status: check.status,
        conclusion: check.conclusion,
        completed_at: check.completed_at
      });
    });

    // Consider check runs - only look at completed check runs with conclusions
    const completedChecks = checksRes.data.check_runs.filter(check => 
      check.status === 'completed' && check.conclusion !== null
    );

    // A check has failed if it's completed and has a failure/cancelled conclusion
    const hasFailedChecks = completedChecks.some(
      check => check.conclusion === 'failure' || check.conclusion === 'cancelled'
    );

    // Final determination
    // Consider status checks
    const isStatusSuccess = statusRes.data.statuses.length === 0 || 
                          statusRes.data.state === 'success' || 
                          statusRes.data.state === 'pending';  // Allow pending state

    // Branch is green if either:
    // 1. There are no checks at all, OR
    // 2. All existing checks are either pending or successful
    const isBaseGreen = 
      (checksRes.data.check_runs.length === 0 && statusRes.data.statuses.length === 0) || // No checks
      (!hasFailedChecks && isStatusSuccess); // All checks passing/pending

    if (isBaseGreen) {
      console.log('\n✅ Base branch is GREEN - no failing checks');
      core.setOutput('is_base_green', 'true');
    } else {
      console.log('\n❌ Base branch is RED - some checks are failing');
      core.setOutput('is_base_green', 'false');
      core.setFailed('Base branch checks are not passing');
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run(); 