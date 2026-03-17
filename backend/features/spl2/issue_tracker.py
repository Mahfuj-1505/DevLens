import requests
from app.config.settings import get_settings

class IssueTracker:

    def __init__(self):
        settings = get_settings()
        self.token = settings.GITHUB_TOKEN
        self.headers = {
            "Accept": "application/vnd.github+json",
        }
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"

    def get_issues(self, github_url: str) -> dict:
        owner, repo = self._parse_url(github_url)

        open_issues = self._fetch_issues(owner, repo, state="open")
        closed_issues = self._fetch_issues(owner, repo, state="closed")

        total_open = len(open_issues)
        total_closed = len(closed_issues)
        total = total_open + total_closed

        label_counts = {}
        for issue in open_issues + closed_issues:
            for label in issue.get("labels", []):
                name = label.get("name", "")
                label_counts[name] = label_counts.get(name, 0) + 1

        labels = sorted(
            [{"label": k, "count": v} for k, v in label_counts.items()],
            key=lambda x: x["count"], reverse=True
        )

        return {
            "githubUrl": github_url,
            "totalIssues": total,
            "openIssues": total_open,
            "closedIssues": total_closed,
            "openRatio": round((total_open / total * 100), 1) if total else 0,
            "closedRatio": round((total_closed / total * 100), 1) if total else 0,
            "labels": labels,
        }

    def _fetch_issues(self, owner: str, repo: str, state: str) -> list:
        issues = []
        page = 1
        while True:
            url = f"https://api.github.com/repos/{owner}/{repo}/issues"
            params = {"state": state, "per_page": 100, "page": page}
            response = requests.get(url, headers=self.headers, params=params, timeout=30)

            if response.status_code == 401:
                raise ValueError("Invalid or missing GitHub token. Add GITHUB_TOKEN to your .env file.")
            if response.status_code == 404:
                raise ValueError(f"Repository not found: {owner}/{repo}")
            if response.status_code != 200:
                raise ValueError(f"GitHub API error: {response.status_code}")

            data = response.json()
            if not data:
                break

            # Filter out pull requests (GitHub API returns PRs as issues too)
            real_issues = [i for i in data if "pull_request" not in i]
            issues.extend(real_issues)

            if len(data) < 100:
                break
            page += 1

        return issues

    def _parse_url(self, github_url: str) -> tuple[str, str]:
        url = github_url.rstrip("/")
        url = url.replace("https://github.com/", "").replace("http://github.com/", "")
        parts = url.split("/")
        if len(parts) < 2:
            raise ValueError(f"Invalid GitHub URL: {github_url}")
        return parts[0], parts[1]