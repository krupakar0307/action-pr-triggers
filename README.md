# PR Workflow Rerunner

A simple GitHub Action that finds all your open pull requests and restarts their latest workflows. Super helpful when you need to refresh all PR checks at once!

## Why use this?

Ever needed to re-run workflows on multiple PRs? Instead of clicking through each PR manually, this action does it all for you in one go.

## How to use it

Add this to your workflow file (`.github/workflows/rerun-prs.yml`):

```yaml
name: Rerun PR Workflows
on:
    workflow_dispatch: # Run manually from GitHub UI
    schedule:
      - cron: '0 */3 * * *' # Or run every 3 hours (optional)
    jobs:
      rerun:
        runs-on: ubuntu-latest
        steps:
          - name: Rerun PR Workflows
            uses: krupakar0307/action-pr-triggers@v1.0.0
            env:
              GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## How does it work?

This action uses the GitHub API to find all open pull requests in your repository. It then checks each PR to see if it has a workflow that has run at least once. If so, it re-runs that workflow.

## What it does

1. 🔍 Finds all open pull requests in your repository
2. 📋 Gets the latest workflow run for each PR
3. 🔄 Triggers a rerun for each workflow
4. 📊 Reports how many workflows were rerun


## Requirements

- Just needs `GITHUB_TOKEN` (automatically provided by GitHub)
- Works with any GitHub-hosted runner

