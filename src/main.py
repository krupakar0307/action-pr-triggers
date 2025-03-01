import os
import sys
import requests
from typing import Tuple

def write_output(name: str, value: str) -> None:
    output_file = os.getenv('GITHUB_OUTPUT')
    if output_file:
        with open(output_file, 'a') as f:
            f.write(f"{name}={value}\n")
    else:
        print(f"Output {name}={value}")

def notify_prs() -> Tuple[int, str]:
    # Get environment variables
    token = os.getenv('GITHUB_TOKEN')
    repo = os.getenv('GITHUB_REPOSITORY')

    # Check for required environment variables
    missing_vars = []
    if not token:
        missing_vars.append('GITHUB_TOKEN')
    if not repo:
        missing_vars.append('GITHUB_REPOSITORY')

    if missing_vars:
        print(f"::error::Missing required environment variables: {', '.join(missing_vars)}")
        return 0, 'failure'

    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/vnd.github.v3+json'
    }

    try:
        # Get all open PRs
        pr_url = f"https://api.github.com/repos/{repo}/pulls?state=open"
        response = requests.get(pr_url, headers=headers)

        if response.status_code != 200:
            print("::error::Error fetching PRs")
            write_output('rerun-status', 'failure')
            return 0, 'failure'

        prs = response.json()
        if not prs:
            print("::info::No open PRs found")
            write_output('rerun-status', 'success')
            return 0, 'success'

        print(f"::info::Found {len(prs)} open PRs - triggering reruns")
        rerun_count = 0

        for pr in prs:
            pr_number = pr['number']
            pr_branch = pr['head']['ref']

            # Get PR's latest workflow run
            run_url = f"https://api.github.com/repos/{repo}/actions/runs?branch={pr_branch}"
            run_response = requests.get(run_url, headers=headers)

            if run_response.status_code != 200:
                print(f"::warning::Error fetching workflows for PR #{pr_number}")
                continue

            runs = run_response.json()['workflow_runs']
            if not runs:
                print(f"::info::No workflows found for PR #{pr_number}")
                continue

            # Trigger rerun
            run_id = runs[0]['id']
            rerun_url = f"https://api.github.com/repos/{repo}/actions/runs/{run_id}/rerun"
            rerun_response = requests.post(rerun_url, headers=headers)

            if rerun_response.status_code == 201:
                rerun_count += 1
                print(f"::info::✓ Triggered rerun for PR #{pr_number} ({pr_branch})")
            else:
                print(f"::warning::✗ Failed to trigger PR #{pr_number}")

        print(f"\n::info::Summary: Triggered {rerun_count} PR workflow reruns")
        write_output('rerun-count', str(rerun_count))
        write_output('rerun-status', 'success')
        return rerun_count, 'success'

    except Exception as error:
        print(f"::error::Action failed with error: {str(error)}")
        return 0, 'failure'

def main():
    notify_prs()

if __name__ == "__main__":
    main() 