import * as github from '@actions/github';

// Replace these with your repository details
const OWNER = 'krupakar0307';
const REPO = 'actions-plays';
const SOURCE_BRANCH = 'main';
const TARGET_BRANCH = 'develop'; // Change this to your target branch

async function testCreatePR() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ Please set GITHUB_TOKEN environment variable');
    process.exit(1);
  }

  const octokit = github.getOctokit(token);

  try {
    console.log(`🔍 Creating sync PR from ${SOURCE_BRANCH} to ${TARGET_BRANCH}`);

    // Get source branch ref
    const { data: sourceRef } = await octokit.rest.repos.getBranch({
      owner: OWNER,
      repo: REPO,
      branch: SOURCE_BRANCH,
    });

    // Create sync branch
    const timestamp = new Date().getTime();
    const syncBranch = `sync/${SOURCE_BRANCH}-to-${TARGET_BRANCH}/${timestamp}`;

    console.log(`📌 Creating branch: ${syncBranch}`);

    await octokit.rest.git.createRef({
      owner: OWNER,
      repo: REPO,
      ref: `refs/heads/${syncBranch}`,
      sha: sourceRef.commit.sha,
    });

    // Create PR
    const { data: pr } = await octokit.rest.pulls.create({
      owner: OWNER,
      repo: REPO,
      title: `Sync: ${SOURCE_BRANCH} to ${TARGET_BRANCH}`,
      body: `Automated PR to sync ${TARGET_BRANCH} with ${SOURCE_BRANCH}`,
      head: syncBranch,
      base: TARGET_BRANCH,
    });

    console.log(`\n✅ Successfully created PR:`);
    console.log(`Title: ${pr.title}`);
    console.log(`URL: ${pr.html_url}`);
    console.log(`Number: #${pr.number}`);

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

testCreatePR(); 