import React from "react";

export default function RepoForm({
  repoSource,
  setRepoSource,
  sourceType,
  setSourceType,
  handleSubmit,
  submittedSource,
  submittedSourceType,
}) {
  const placeholder =
    sourceType === "local"
      ? "Enter local repository path..."
      : "Enter GitHub repository link...";

  return (
    <div>
      <form className="repo-form" onSubmit={handleSubmit}>
        <select
          className="repo-input"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
        >
          <option value="github">Repo link</option>
          <option value="local">Local path</option>
        </select>
        <input
          type="text"
          className="repo-input"
          placeholder={placeholder}
          value={repoSource}
          onChange={(e) => setRepoSource(e.target.value)}
        />
      </form>

      {sourceType === "local" && (
        <p className="submitted-link" style={{ marginTop: 6 }}>
          Example: /home/user/projects/my-repo or ~/projects/my-repo
        </p>
      )}

      {submittedSource && (
        <p className="submitted-link">
          Submitted Repository ({submittedSourceType === "local" ? "Local path" : "Repo link"}):{" "}
          {submittedSourceType === "github" ? (
            <a href={submittedSource} target="_blank" rel="noopener noreferrer">
              {submittedSource}
            </a>
          ) : (
            <span>{submittedSource}</span>
          )}
        </p>
      )}
    </div>
  );
}
