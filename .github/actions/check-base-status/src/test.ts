import * as core from '@actions/core';
import * as github from '@actions/github';

async function testRun(): Promise<void> {
  // You'll need to provide your GitHub token here
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Please set GITHUB_TOKEN environment variable');
    process.exit(1);
  }

  const octokit = github.getOctokit(token);
  
  // Replace these with your repository details
  const owner = 'your-username';
  const repo = 'your-repo-name';
  const branch = 'main';

  try {
    // Test the branch status check
    const { data: baseRef } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch,
    });

    const latestCommitSha = baseRef.commit.sha;
    console.log(`Latest commit SHA: ${latestCommitSha}`);

    const { data: status } = await octokit.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref: latestCommitSha,
    });

    const { data: checkRuns } = await octokit.rest.checks.listForRef({
      owner,
      repo,
      ref: latestCommitSha,
    });

    console.log('\nStatus Check Results:');
    console.log('--------------------');
    console.log(`Overall Status: ${status.state}`);
    console.log('\nCheck Runs:');
    checkRuns.check_runs.forEach(check => {
      console.log(`- ${check.name}: ${check.conclusion}`);
    });

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    }
  }
}

testRun(); 