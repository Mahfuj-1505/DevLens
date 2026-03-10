"""
git_utils.py - Essential Git operations for analysis
"""
import subprocess
from pathlib import Path
from typing import List


class GitUtils:
    """Essential Git operations for repository analysis"""
    
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
    
    def run_git_command(self, cmd: List[str], timeout=60) -> str:
        """Run git command in repository"""
        try:
            result = subprocess.run(
                cmd,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True,
                timeout=timeout
            )
            return result.stdout.strip()
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            return ""
    
    def is_git_repository(self) -> bool:
        """Check if path is a valid git repository"""
        return (self.repo_path / '.git').exists()
    
    def identify_repo_owners(self, top_n: int = 3) -> List[str]:
        """Identify top contributors"""
        print("Identifying repository owners...")
        
        output = self.run_git_command([
            'git', 'shortlog', '-sn', '--all', '--no-merges'
        ])
        
        if not output:
            return []
        
        authors = []
        for line in output.split('\n'):
            if line.strip():
                parts = line.strip().split('\t', 1)
                if len(parts) == 2:
                    count = int(parts[0])
                    author = parts[1]
                    authors.append((author, count))
        
        authors.sort(key=lambda x: x[1], reverse=True)
        top_count = min(top_n, len(authors))
        owners = [author for author, _ in authors[:top_count]]
        
        print(f"Repository owners: {owners}")
        return owners
    
    def get_file_authors(self, file_path: str) -> List[str]:
        """Get all authors who modified a specific file"""
        output = self.run_git_command([
            'git', 'log', '--no-merges', '--pretty=format:%an', '--', file_path
        ])
        
        if not output:
            return []
        
        return output.split('\n')
    
    def list_tracked_files(self) -> List[Path]:
        """Get all tracked files from git"""
        print("Getting tracked files from git...")
        
        output = self.run_git_command(['git', 'ls-files'])
        
        if not output:
            return []
        
        files = []
        for line in output.split('\n'):
            if line.strip():
                file_path = self.repo_path / line.strip()
                if file_path.exists():
                    files.append(file_path)
        
        print(f"Found {len(files)} tracked files")
        return files