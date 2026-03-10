"""
file_filters.py - Simple file filtering
"""
from pathlib import Path


class FileFilters:
    """Simple file filters for code analysis"""
    
    def __init__(self, repo_path: Path):
        self.repo_path = repo_path
        
        # Directories to exclude
        self.exclude_dirs = {
            'node_modules', 'venv', '.venv', 'env', '__pycache__',
            '.git', 'build', 'dist', 'target', 'vendor'
        }
        
    def should_exclude(self, file_path: Path) -> bool:
        """Check if file should be excluded"""
        # Check if any parent directory is in exclude list
        for part in file_path.parts:
            if part in self.exclude_dirs:
                return True
        return False