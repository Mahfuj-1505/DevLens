import React, { useRef, useState } from "react";

export default function RepoForm({
  repoSource,
  setRepoSource,
  sourceType,
  setSourceType,
  handleSubmit,
  submittedSource,
  submittedSourceType,
}) {
  const [activeSourceTypeDropdown, setActiveSourceTypeDropdown] = useState(false);
  const sourceTypeDropdownRef = useRef(null);

  const placeholder =
    sourceType === "local"
      ? "Enter local repository path..."
      : "Enter GitHub repository link...";

  const sourceTypeOptions = [
    { value: "github", label: "Repo link" },
    { value: "local", label: "Local path" },
  ];

  React.useEffect(() => {
    function handleOutsideClick(event) {
      if (
        activeSourceTypeDropdown &&
        sourceTypeDropdownRef.current &&
        !sourceTypeDropdownRef.current.contains(event.target)
      ) {
        setActiveSourceTypeDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeSourceTypeDropdown]);

  return (
    <div>
      <form className="repo-form" onSubmit={handleSubmit}>
        <div className="repo-source-dropdown" ref={sourceTypeDropdownRef}>
          <button
            type="button"
            className="repo-source-toggle"
            onClick={() => setActiveSourceTypeDropdown((prev) => !prev)}
          >
            {sourceTypeOptions.find((opt) => opt.value === sourceType)?.label}
            <span className={`repo-source-arrow ${activeSourceTypeDropdown ? "open" : ""}`} />
          </button>
          {activeSourceTypeDropdown && (
            <ul className="repo-source-menu">
              {sourceTypeOptions.map((option) => (
                <li
                  key={option.value}
                  className={`repo-source-item ${sourceType === option.value ? "active" : ""}`}
                  onClick={() => {
                    setSourceType(option.value);
                    setActiveSourceTypeDropdown(false);
                  }}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>
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
