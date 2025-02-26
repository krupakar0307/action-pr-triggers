import * as core from '@actions/core';
import * as github from '@actions/github';
import fs from 'fs';
import axios from 'axios';

async function writeOutput(name, value) {
    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
        fs.appendFileSync(outputFile, `${name}=${value}\n`);
    } else {
        console.log(`Output ${name}=${value}`);
    }
}

async function notifyPrs() {
    // Get environment variables
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPOSITORY;

    // Check for required environment variables
    const missingVars = [];
    if (!token) missingVars.push('GITHUB_TOKEN');
    if (!repo) missingVars.push('GITHUB_REPOSITORY');

    if (missingVars.length > 0) {
        core.setFailed(`Missing required environment variables: ${missingVars.join(', ')}`);
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
    };

    try {
        // Get all open PRs
        const prUrl = `https://api.github.com/repos/${repo}/pulls?state=open`;
        const response = await axios.get(prUrl, { headers });

        if (response.status !== 200) {
            core.error('Error fetching PRs');
            await writeOutput('rerun-status', 'failure');
            return [0, 'failure'];
        }

        const prs = response.data;
        if (!prs.length) {
            core.info('No open PRs found');
            await writeOutput('rerun-status', 'success');
            return [0, 'success'];
        }

        core.info(`Found ${prs.length} open PRs - triggering reruns`);
        let rerunCount = 0;

        for (const pr of prs) {
            const prNumber = pr.number;
            const prBranch = pr.head.ref;

            // Get PR's latest workflow run
            const runUrl = `https://api.github.com/repos/${repo}/actions/runs?branch=${prBranch}`;
            const runResponse = await axios.get(runUrl, { headers });

            if (runResponse.status !== 200) {
                core.warning(`Error fetching workflows for PR #${prNumber}`);
                continue;
            }

            const runs = runResponse.data.workflow_runs;
            if (!runs.length) {
                core.info(`No workflows found for PR #${prNumber}`);
                continue;
            }

            // Trigger rerun
            const runId = runs[0].id;
            const rerunUrl = `https://api.github.com/repos/${repo}/actions/runs/${runId}/rerun`;
            const rerunResponse = await axios.post(rerunUrl, {}, { headers });

            if (rerunResponse.status === 201) {
                rerunCount++;
                core.info(`✓ Triggered rerun for PR #${prNumber} (${prBranch})`);
            } else {
                core.warning(`✗ Failed to trigger PR #${prNumber}`);
            }
        }

        core.info(`\nSummary: Triggered ${rerunCount} PR workflow reruns`);
        await writeOutput('rerun-count', rerunCount.toString());
        await writeOutput('rerun-status', 'success');
        return [rerunCount, 'success'];

    } catch (error) {
        core.setFailed(`Action failed with error: ${error.message}`);
        return [0, 'failure'];
    }
}

async function run() {
    await notifyPrs();
}

run(); 