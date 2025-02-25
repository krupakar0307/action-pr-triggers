import * as github from '@actions/github';

// Replace these with your repository details
const OWNER = 'krupakar0307';
const REPO = 'actions-plays';
const BRANCH = 'main';

async function checkBranchStatus() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ Please set GITHUB_TOKEN environment variable');
    process.exit(1);
  }

  const octokit = github.getOctokit(token);

  try {
    console.log(`🔍 Checking status for ${OWNER}/${REPO}:${BRANCH}`);

    const { data: baseRef } = await octokit.rest.repos.getBranch({
      owner: OWNER,
      repo: REPO,
      branch: BRANCH,
    });

    const sha = baseRef.commit.sha;
    console.log(`\n📌 Latest commit: ${sha.substring(0, 7)}`);

    const [statusRes, checksRes] = await Promise.all([
      octokit.rest.repos.getCombinedStatusForRef({
        owner: OWNER,
        repo: REPO,
        ref: sha,
      }),
      octokit.rest.checks.listForRef({
        owner: OWNER,
        repo: REPO,
        ref: sha,
      })
    ]);

    console.log(`\n📊 Status Checks:`);
    console.log(`Overall Status: ${statusRes.data.state.toUpperCase()}`);

    console.log(`\n🔍 Check Runs:`);
    checksRes.data.check_runs.forEach(check => {
      const status = check.conclusion || check.status;
      const emoji = status === 'success' ? '✅' : status === 'failure' ? '❌' : '⏳';
      console.log(`${emoji} ${check.name}: ${status}`);
    });

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

checkBranchStatus(); 