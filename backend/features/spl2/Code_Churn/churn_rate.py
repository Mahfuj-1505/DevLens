import shutil
import tempfile
import subprocess


class ChurnRate:

    def get_churn(self, github_url: str, top_n: int = 20) -> dict:
        clone_dir = tempfile.mkdtemp(prefix="devlens_churn_")
        try:
            result = subprocess.run(
                ["git", "clone", "--quiet", github_url, clone_dir],
                capture_output=True, text=True, timeout=120
            )
            if result.returncode != 0:
                raise ValueError(f"Failed to clone repository: {result.stderr.strip()}")

            log_result = subprocess.run(
                ["git", "log", "--numstat", "--format=%H"],
                capture_output=True, text=True, cwd=clone_dir
            )
            if log_result.returncode != 0:
                raise ValueError("Failed to retrieve churn data")

            file_stats: dict[str, dict] = {}

            for line in log_result.stdout.splitlines():
                line = line.strip()
                if not line:
                    continue
                if len(line) == 40 and all(c in "0123456789abcdef" for c in line):
                    continue
                parts = line.split("\t")
                if len(parts) == 3:
                    try:
                        added = int(parts[0]) if parts[0] != "-" else 0
                        deleted = int(parts[1]) if parts[1] != "-" else 0
                        filename = parts[2]
                        if filename not in file_stats:
                            file_stats[filename] = {"additions": 0, "deletions": 0, "commits": 0}
                        file_stats[filename]["additions"] += added
                        file_stats[filename]["deletions"] += deleted
                        file_stats[filename]["commits"] += 1
                    except ValueError:
                        continue

            if not file_stats:
                return {
                    "githubUrl": github_url,
                    "summary": {"totalChurnLines": 0, "totalAdditions": 0, "totalDeletions": 0, "churnRate": 0},
                    "files": []
                }

            total_additions = sum(s["additions"] for s in file_stats.values())
            total_deletions = sum(s["deletions"] for s in file_stats.values())
            total_churn = total_additions + total_deletions
            total_net = total_additions - total_deletions
            overall_churn_rate = round((total_deletions / total_additions * 100), 1) if total_additions else 0

            files = []
            for filename, stats in file_stats.items():
                churn_rate = round((stats["deletions"] / stats["additions"] * 100), 1) if stats["additions"] else 0
                files.append({
                    "file": filename,
                    "additions": stats["additions"],
                    "deletions": stats["deletions"],
                    "churnLines": stats["additions"] + stats["deletions"],
                    "commits": stats["commits"],
                    "churnRate": churn_rate,
                })

            files.sort(key=lambda x: x["churnRate"], reverse=True)

            return {
                "githubUrl": github_url,
                "summary": {
                    "totalAdditions": total_additions,
                    "totalDeletions": total_deletions,
                    "totalChurnLines": total_churn,
                    "netLines": total_net,
                    "churnRate": overall_churn_rate,
                },
                "files": files[:top_n]
            }

        finally:
            shutil.rmtree(clone_dir, ignore_errors=True)