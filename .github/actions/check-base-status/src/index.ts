import * as core from '@actions/core';
import * as github from '@actions/github';

async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const baseBranch = core.getInput('base-branch') || 'main';

    // Create octokit client
    const octokit = github.getOctokit(token);
    const context = github.context;

    // Get the latest commit on base branch
    const { data: baseRef } = await octokit.rest.repos.getBranch({
      owner: context.repo.owner,
      repo: context.repo.repo,
      branch: baseBranch,
    });

    const latestCommitSha = baseRef.commit.sha;

    // Get the combined status for the latest commit
    const { data: status } = await octokit.rest.repos.getCombinedStatusForRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: latestCommitSha,
    });

    // Get check runs for the commit
    const { data: checkRuns } = await octokit.rest.checks.listForRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: latestCommitSha,
    });

    // Analyze status checks
    const isStatusSuccess = status.state === 'success';
    
    // Analyze check runs
    const hasFailedChecks = checkRuns.check_runs.some(
      check => check.conclusion === 'failure' || check.conclusion === 'cancelled'
    );

    // Final status determination
    const isBaseGreen = isStatusSuccess && !hasFailedChecks;

    if (isBaseGreen) {
      core.info(`✅ ${baseBranch} branch is GREEN - all checks are passing`);
      core.setOutput('is_base_green', 'true');
    } else {
      core.setFailed(`❌ ${baseBranch} branch is RED - some checks are failing`);
      core.setOutput('is_base_green', 'false');
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run(); 