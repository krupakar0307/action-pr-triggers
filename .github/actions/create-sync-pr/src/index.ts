import * as core from '@actions/core';
import * as github from '@actions/github';

async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const sourceBranch = core.getInput('source-branch') || 'main';
    const targetBranches = core.getInput('target-branches', { required: true })
      .split(',')
      .map(branch => branch.trim());
    const prTitleTemplate = core.getInput('pr-title');
    const prBodyTemplate = core.getInput('pr-body');

    // Create octokit client
    const octokit = github.getOctokit(token);
    const context = github.context;

    for (const targetBranch of targetBranches) {
      try {
        core.info(`Processing sync from ${sourceBranch} to ${targetBranch}`);

        // Get the latest commit on source branch
        const { data: sourceRef } = await octokit.rest.repos.getBranch({
          owner: context.repo.owner,
          repo: context.repo.repo,
          branch: sourceBranch,
        });

        // Create a new branch for the PR
        const timestamp = new Date().getTime();
        const syncBranch = `sync/${sourceBranch}-to-${targetBranch}/${timestamp}`;

        // Create branch from source branch's latest commit
        await octokit.rest.git.createRef({
          owner: context.repo.owner,
          repo: context.repo.repo,
          ref: `refs/heads/${syncBranch}`,
          sha: sourceRef.commit.sha,
        });

        // Replace variables in PR title and body
        const prTitle = prTitleTemplate
          .replace('$source_branch', sourceBranch)
          .replace('$target_branch', targetBranch);
        
        const prBody = prBodyTemplate
          .replace('$source_branch', sourceBranch)
          .replace('$target_branch', targetBranch);

        // Create PR
        const { data: pr } = await octokit.rest.pulls.create({
          owner: context.repo.owner,
          repo: context.repo.repo,
          title: prTitle,
          body: prBody,
          head: syncBranch,
          base: targetBranch,
        });

        core.info(`✅ Created PR #${pr.number} to sync ${targetBranch} with ${sourceBranch}`);
        core.setOutput(`pr_number_${targetBranch}`, pr.number);
        core.setOutput(`pr_url_${targetBranch}`, pr.html_url);

      } catch (error) {
        if (error instanceof Error) {
          core.warning(`Failed to create PR for ${targetBranch}: ${error.message}`);
        }
        continue;
      }
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run(); 