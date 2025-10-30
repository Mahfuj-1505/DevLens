import React from "react";

export default function RepoForm({ repoLink, setRepoLink, handleSubmit, submittedLink }) {
  return (
    <div>
      <form className="repo-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="repo-input"
          placeholder="Enter GitHub repository link..."
          value={repoLink}
          onChange={(e) => setRepoLink(e.target.value)}
        />
      </form>

      {submittedLink && (
        <p className="submitted-link">
          Submitted Repository:{" "}
          <a href={submittedLink} target="_blank" rel="noopener noreferrer">
            {submittedLink}
          </a>
        </p>
      )}
    </div>
  );
}
