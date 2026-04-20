"""
code_parser.py - Extract functions and variables from source code
Supports: Python, JavaScript, Java, C, C++
"""
import re
from typing import Dict, List
from pathlib import Path


class CodeParser:
    """Extract functions and variables from code files"""
    
    def __init__(self):
        # Supported languages
        self.supported_languages = {'python', 'javascript', 'java', 'c', 'cpp'}
        
        # Language-specific patterns for function extraction
        self.function_patterns = {
            'python': re.compile(r'^\s*def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(', re.MULTILINE),
            
            'javascript': re.compile(
                r'(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(|'
                r'(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|'
                r'([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*(?:async\s+)?function)',
                re.MULTILINE
            ),
            
            'java': re.compile(
                r'(?:public|private|protected|static|final|native|synchronized|abstract|\s)+[\w<>\[\]]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{',
                re.MULTILINE
            ),
            
            'c': re.compile(
                r'(?:[\w\*]+\s+)+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{',
                re.MULTILINE
            ),
            
            'cpp': re.compile(
                r'(?:[\w:]+\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*(?:const)?\s*\{',
                re.MULTILINE
            ),
        }
        
        # Language-specific patterns for variable extraction
        self.variable_patterns = {
            'python': re.compile(r'^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=', re.MULTILINE),
            
            'javascript': re.compile(
                r'(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=',
                re.MULTILINE
            ),
            
            'java': re.compile(
                r'(?:private|public|protected|static|final|\s)+[\w<>\[\]]+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[=;]',
                re.MULTILINE
            ),
            
            'c': re.compile(
                r'(?:int|float|double|char|void|long|short|unsigned|signed|static)\s+\*?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[=;\[]',
                re.MULTILINE
            ),
            
            'cpp': re.compile(
                r'(?:int|float|double|char|bool|auto|const|static|std::[\w<>]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[=;]',
                re.MULTILINE
            ),
        }
        
        # Common keywords to exclude
        self.exclude_keywords = {
            'if', 'else', 'elif', 'for', 'while', 'switch', 'case', 
            'do', 'break', 'continue', 'return', 'goto', 'try', 
            'catch', 'finally', 'throw', 'raises', 'except', 'with',
            'yield', 'assert', 'pass', 'await', 'async', 'defer',
            'this', 'self', 'super', 'null', 'true', 'false', 
            'None', 'True', 'False', 'main', 'new', 'delete',
            'class', 'struct', 'enum', 'interface', 'import',
            'from', 'export', 'default', 'extends', 'implements'
        }
    
    def get_language(self, file_path: Path) -> str:
        """Determine language from file extension"""
        ext = file_path.suffix.lower()
        language_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'javascript',
            '.tsx': 'javascript',
            '.java': 'java',
            '.c': 'c',
            '.h': 'c',
            '.cpp': 'cpp',
            '.cc': 'cpp',
            '.cxx': 'cpp',
            '.hpp': 'cpp',
            '.hh': 'cpp',
        }
        return language_map.get(ext, None)
    
    def is_valid_identifier(self, name: str) -> bool:
        """Check if identifier is valid and meaningful"""
        if not name or len(name) < 2:
            return False
        
        if name.lower() in self.exclude_keywords:
            return False
        
        # Must start with letter or underscore
        if not re.match(r'^[a-zA-Z_]', name):
            return False
        
        return True
    
    def extract_functions(self, code: str, language: str) -> Dict[str, int]:
        """Extract function names and their occurrence counts."""
        if language not in self.function_patterns:
            return {}
        
        pattern = self.function_patterns[language]
        matches = pattern.findall(code)
        
        function_counts: Dict[str, int] = {}
        for match in matches:
            # Handle tuple results from multiple capture groups
            if isinstance(match, tuple):
                for name in match:
                    if name and self.is_valid_identifier(name):
                        function_counts[name] = function_counts.get(name, 0) + 1
            else:
                if self.is_valid_identifier(match):
                    function_counts[match] = function_counts.get(match, 0) + 1
        
        return function_counts
    
    def extract_variables(self, code: str, language: str) -> Dict[str, int]:
        """Extract variable names and occurrence counts."""
        if language not in self.variable_patterns:
            return {}
        
        pattern = self.variable_patterns[language]
        matches = pattern.findall(code)
        
        variable_counts: Dict[str, int] = {}
        
        for match in matches:
            if self.is_valid_identifier(match):
                variable_counts[match] = variable_counts.get(match, 0) + 1
        
        return variable_counts

    def count_comments(self, code: str, language: str) -> int:
        """Count comment lines by language."""
        lines = code.splitlines()
        count = 0

        if language == 'python':
            in_triple = False
            triple_delim = None
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    continue

                if in_triple:
                    count += 1
                    if triple_delim in stripped:
                        in_triple = False
                        triple_delim = None
                    continue

                if stripped.startswith('#'):
                    count += 1
                    continue

                if stripped.startswith("'''") or stripped.startswith('"""'):
                    count += 1
                    if stripped.count("'''") == 2 or stripped.count('"""') == 2:
                        continue
                    in_triple = True
                    triple_delim = "'''" if stripped.startswith("'''") else '"""'
        else:
            in_block = False
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    continue

                if in_block:
                    count += 1
                    if '*/' in stripped:
                        in_block = False
                    continue

                if stripped.startswith('//'):
                    count += 1
                    continue

                if stripped.startswith('/*'):
                    count += 1
                    if '*/' not in stripped:
                        in_block = True

        return count
    
    def parse_file(self, file_path: Path) -> Dict:
        """Parse a file and extract functions and variables"""
        language = self.get_language(file_path)
        
        if not language:
            return None
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                code = f.read()
            
            function_counts = self.extract_functions(code, language)
            variable_counts = self.extract_variables(code, language)
            comments = self.count_comments(code, language)
            
            return {
                'language': language,
                'functions': list(function_counts.keys()),
                'function_name_counts': function_counts,
                'function_count': len(function_counts),
                'variables': list(variable_counts.keys()),
                'variable_name_counts': variable_counts,
                'variable_count': len(variable_counts),
                'comments': comments
            }
        except Exception:
            return None