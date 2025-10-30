const splOptions = {
  "SPL-1": [
    "LOC",
    {
      label: "Code Complexity",
      children: ["Number of functions", "Time complexity", "Code duplication"],
    },
    {
      label: "Commit",
      children: [
        "Meaningfulness",
        "Number of commits",
        "Changes per commit",
        "Activity graph",
      ],
    },
    "AI generated code %",
    "Naming conventions",
  ],

  "SPL-2": [
    "LOC",
    "Code Ownership",
    "SOLID Principle",
    {
      label: "Performance",
      children: ["Query Complexity", "File change heatmap", "Churn rate"],
    },
    {
      label: "Code Quality",
      children: ["Code duplication", "Number of functions", "Time complexity"],
    },
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
