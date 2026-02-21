import React, { useState } from "react";
import splOptions from "./data/splOptions";
import {Link} from "react-router-dom"
export default function OptionPanel({ spl, setShowSummary, setSelectedOptions }) {
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [checked, setChecked] = useState({});
  const [mode, setMode] = useState(null);

  const options = splOptions[spl] || [];
  const defaultOptions = ["LOC", "Code Complexity", "Commit Activity"];

  const handleCheck = (option, isGroup = false, groupIndex = null) => {
    setChecked((prev) => {
      const key = isGroup ? option : groupIndex !== null ? `${groupIndex}-${option}` : option;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const handleNext = () => {
    const selected = Object.keys(checked).filter((key) => checked[key]);
    setSelectedOptions(selected.length > 0 ? selected : defaultOptions);
    setShowSummary(true);
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
        <div className="flow-section card-container fade-in">
          {mode === "Default Option" && (
            <div>
              <p>Preselected Options:</p>
              <span>{defaultOptions.join(", ")}</span>
              <br />
              <button className="generate_summary" onClick={handleNext}>
                Generate Summary
              </button>
            </div>
          )}

          {mode === "Advanced Option" && (
            <div>
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
              <button className="generate_summary" onClick={handleNext}>
                Generate Summary
              </button>
              <Link to="/result-page" >Generate Summary</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
