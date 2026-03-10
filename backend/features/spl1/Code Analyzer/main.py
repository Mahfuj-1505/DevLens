"""
main.py - Simple entry point for Code Analyzer
"""
from repo_analyzer import RepoAnalyzer
from pathlib import Path


class CodeAnalyzer:
    """
    Simple user-facing class for analyzing code repositories
    
    Usage:
        analyzer = CodeAnalyzer('/path/to/cloned/repo')
        result = analyzer.analyze()
        analyzer.save_json('output.json')
    """
    
    def __init__(self, repo_path: str):
        """
        Initialize analyzer with a cloned repository path
        
        Args:
            repo_path: Path to a cloned git repository
        """
        self.analyzer = RepoAnalyzer(repo_path)
    
    def analyze(self) -> dict:
        """
        Analyze the repository and return results
        
        Returns:
            dict: Analysis results containing:
                - repository: Path to repository
                - owners: List of main contributors
                - total_files: Number of user-written files
                - total_loc: Total lines of code
                - total_functions: Total function count
                - total_variables: Total variable count
                - languages: List of detected languages
                - files: List of file details with functions/variables
        """
        return self.analyzer.analyze()
    
    def save_json(self, output_file: str = 'analysis_result.json') -> str:
        """
        Analyze and save results to JSON file
        
        Args:
            output_file: Output JSON file path
            
        Returns:
            str: Path to saved file
        """
        return self.analyzer.save_to_json(output_file)


def main():
    """Command-line entry point"""
    print("=" * 70)
    print("Code Analyzer - Extract LOC, Functions, and Variables")
    print("=" * 70)
    print("\nSupported languages: Python, JavaScript, Java, C, C++")
    print("\nThis tool:")
    print("  1. Identifies user-written files (not boilerplate)")
    print("  2. Counts lines of code using lizard")
    print("  3. Extracts function and variable names")
    print("=" * 70)
    
    repo_path = input("\nEnter path to cloned repository: ").strip()
    
    if not repo_path:
        print("❌ Error: Empty path!")
        return
    
    if not Path(repo_path).exists():
        print(f"❌ Error: Path does not exist: {repo_path}")
        return
    
    output_file = input("Output file name (default: analysis_result.json): ").strip()
    if not output_file:
        output_file = 'analysis_result.json'
    
    try:
        analyzer = CodeAnalyzer(repo_path)
        saved_path = analyzer.save_json(output_file)
        print(f"\n✅ Analysis completed successfully!")
        print(f"✅ Results saved to: {saved_path}")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Analysis interrupted by user")
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()