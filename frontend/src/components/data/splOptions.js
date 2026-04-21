const splOptions = {
  "SPL-1": [
    "Lines of Code (LOC)",
    {
      label: "Code Complexity",
      children: [
        "Number of functions",
        "Cyclomatic Complexity",
        "Code duplication",
      ],
    },
    {
      label: "Commits & Activity",
      children: [
        "Commit message quality",
        "Number of commits",
        "Changes per commit",
        "Activity graph",
      ],
    },
    "Clean code - Naming conventions",
  ],

  "SPL-2": [
    "Lines of Code (LOC)",
    {
      label: "Code Complexity",
      children: [
        "Number of functions",
        "Cyclomatic Complexity",
        "Code duplication",
      ],
    },
    {
      label: "Commits & Activity",
      children: [
        "Commit message quality",
        "Number of commits",
        "Changes per commit",
        "Activity graph",
      ],
    },
    "Clean code - Naming conventions",
    "Code Ownership",
    "Churn rate",
    "File change heatmap",
    "Issue Tracking",
    {
      label: "Class and Component Design",
      children: [
        "WMC (Weighted Methods per Class)",
        "LCOM (Lack of Cohesion of Methods)",
        "DIT (Depth of Inheritance Tree)",
        "NOC (Number of Children)",
      ],
    },
    "Feature branching and merging",
  ],

  "SPL-3": [
    "LOC",
    "Time Complexity",
    "Design Consistency",
    "SOLID Principle",
    "Function Reusability",
    "Database Design",
    "Query Complexity",
    "Test Coverage",
    "Commit Regularity",
    "Activity Graph",
    "Architecture Diagram",
    "CI/CD Evidence",
    "Security Scanning",
    "AI Detection",
  ],
};

export default splOptions;
