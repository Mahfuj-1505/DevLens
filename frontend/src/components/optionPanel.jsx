import React, { useState } from "react";
import splOptions from "./data/splOptions";
import { useNavigate } from "react-router-dom";

export default function OptionPanel({ spl, setShowSummary, setSelectedOptions, repoSource, sourceType }) {
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [checked, setChecked] = useState({});
  const [mode, setMode] = useState(null);
  const navigate = useNavigate();

  const options = splOptions[spl] || [];

  const defaultOptions = options.flatMap((opt, index) =>
    typeof opt === "string"
      ? [opt]
      : opt.children.map((child) => `${index}-${child}`)
  );

  const defaultDisplayList = options.flatMap((opt) =>
    typeof opt === "string" ? [opt] : opt.children.map((child) => child)
  );

  const handleCheck = (option, isGroup = false, groupIndex = null) => {
    setChecked((prev) => {
      const key = isGroup ? option : groupIndex !== null ? `${groupIndex}-${option}` : option;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const handleNext = (selected, isDefault = false) => {
    if (!repoSource || repoSource.trim() === "") {
      alert(`Please enter a ${sourceType === "local" ? "local repository path" : "GitHub repository URL"} first!`);
      return;
    }
    setSelectedOptions(selected);
    navigate("/result-page", {
      state: {
        repoSource: repoSource.trim(),
        sourceType,
        selectedOptions: selected,
        isDefault,
        spl,
      },
    });
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", gap: "24px" }}>
      <div className="flow-section fade-in" style={{ flex: "0 0 160px", borderRight: "1px solid rgba(255,255,255,0.15)", paddingRight: "24px" }}>
        {["Default Option", "Advanced Option"].map((opt) => (
          <button
            key={opt}
            className={`mode-button ${mode === opt ? "active" : ""}`}
            onClick={() => setMode(opt)}
          >
            {opt}
          </button>
        ))}
      </div>

      {mode && (
        <div className="flow-section card-container fade-in" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          {mode === "Default Option" && (
            <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
              <p style={{ marginBottom: 10, fontSize: "0.85rem", opacity: 0.8 }}>
                All features for {spl}:
              </p>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 6 }}>
                <ul style={{ listStyle: "none", padding: 0, marginBottom: 12 }}>
                  {defaultDisplayList.map((item, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: "0.85rem" }}>
                      <span style={{ color: "#a855f7", fontSize: "0.7rem" }}>✦</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <button style={{ marginTop: 8 }} className="generate_summary" onClick={() => handleNext(defaultOptions, true)}>
                Generate Summary
              </button>
            </div>
          )}

          {mode === "Advanced Option" && (
            <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 6 }}>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {options.map((opt, index) =>
                    typeof opt === "string" ? (
                      <li key={index}>
                        <label>
                          <input
                            type="checkbox"
                            checked={checked[opt] || false}
                            onChange={() => handleCheck(opt)}
                          />
                          {opt}
                        </label>
                      </li>
                    ) : (
                      <li key={index}>
                        <div
                          onClick={() =>
                            setExpandedGroup(expandedGroup === opt.label ? null : opt.label)
                          }
                          style={{ cursor: "pointer", fontWeight: "bold", marginTop: "5px" }}
                        >
                          {opt.label} {expandedGroup === opt.label ? "▾" : "▸"}
                        </div>
                        {expandedGroup === opt.label && (
                          <ul style={{ paddingLeft: "15px" }}>
                            {opt.children.map((child, i) => (
                              <li key={i}>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={checked[`${index}-${child}`] || false}
                                    onChange={() => handleCheck(child, false, index)}
                                  />
                                  {child}
                                </label>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  )}
                </ul>
              </div>
              <button
                style={{ marginTop: 8 }}
                className="generate_summary"
                onClick={() => {
                  const selected = Object.keys(checked).filter((key) => checked[key]);
                  handleNext(selected.length > 0 ? selected : defaultOptions);
                }}
              >
                Generate Summary
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}