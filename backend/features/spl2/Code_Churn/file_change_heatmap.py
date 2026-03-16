"""
File Change Heatmap Service
Analyzes which files changed most frequently in a GitHub repository.
Returns top 20 files with a heat score for color coding.
"""

import os
import shutil
import tempfile
import subprocess


class FileChangeHeatmap:

    def get_heatmap(self, github_url: str, top_n: int = 20) -> dict:
        clone_dir = tempfile.mkdtemp(prefix="devlens_heatmap_")
        try:
            result = subprocess.run(
                ["git", "clone", "--quiet", github_url, clone_dir],
                capture_output=True, text=True, timeout=120
            )
            if result.returncode != 0:
                raise ValueError(f"Failed to clone repository: {result.stderr.strip()}")

            log_result = subprocess.run(
                ["git", "log", "--name-only", "--format="],
                capture_output=True, text=True, cwd=clone_dir
            )
            if log_result.returncode != 0:
                raise ValueError("Failed to retrieve file change history")

            file_counts: dict[str, int] = {}
            for line in log_result.stdout.splitlines():
                line = line.strip()
                if line:
                    file_counts[line] = file_counts.get(line, 0) + 1

            if not file_counts:
                return {
                    "githubUrl": github_url,
                    "totalUniqueFiles": 0,
                    "files": []
                }

            max_count = max(file_counts.values())
            min_count = min(file_counts.values())

            all_files = []
            for filename, count in file_counts.items():
                if max_count == min_count:
                    heat = 1.0
                else:
                    heat = (count - min_count) / (max_count - min_count)

                all_files.append({
                    "file": filename,
                    "changes": count,
                    "heat": round(heat, 3),
                    "color": self._heat_to_color(heat)
                })

            all_files.sort(key=lambda x: x["changes"], reverse=True)

            frequent_files = [f for f in all_files if f["heat"] > 0.3][:top_n]

            if not frequent_files:
                frequent_files = all_files[:5]

            return {
                "githubUrl": github_url,
                "totalUniqueFiles": len(file_counts),
                "files": frequent_files
            }

        finally:
            shutil.rmtree(clone_dir, ignore_errors=True)

    def _heat_to_color(self, heat: float) -> str:
        if heat <= 0.5:
            ratio = heat / 0.5
            r = int(74 + (250 - 74) * ratio)
            g = int(222 + (204 - 222) * ratio)
            b = int(128 + (21 - 128) * ratio)
        else:
            ratio = (heat - 0.5) / 0.5
            r = int(250 + (248 - 250) * ratio)
            g = int(204 + (113 - 204) * ratio)
            b = int(21 + (113 - 21) * ratio)

        return f"#{r:02x}{g:02x}{b:02x}"