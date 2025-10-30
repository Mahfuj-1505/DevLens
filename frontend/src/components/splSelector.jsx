import React from "react";

export default function SplSelector({ selectedSpl, setSelectedSpl }) {
  return (
    <div className="flow-section spl-options fade-in">
      {["SPL-1", "SPL-2", "SPL-3"].map((spl, index) => (
        <button
          key={index}
          className={`spl-button ${selectedSpl === spl ? "active" : ""}`}
          onClick={() => setSelectedSpl(spl)}
        >
          {spl}
        </button>
      ))}
    </div>
  );
}
