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

    // Final determination
    // Consider the branch green if there are no checks or all existing checks pass
    const isStatusSuccess = statusRes.data.statuses.length === 0 || statusRes.data.state === 'success';
    const hasFailedChecks = checksRes.data.check_runs.some(
      check => check.conclusion === 'failure' || check.conclusion === 'cancelled'
    );

    const isBaseGreen = isStatusSuccess && !hasFailedChecks;

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