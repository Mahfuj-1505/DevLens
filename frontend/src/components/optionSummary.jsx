import React from "react";

export default function OptionSummary({ selectedOptions }) {
  return (
    <div className="result fade-in">
      <h3>Selected Options:</h3>
      <p>{selectedOptions.join(", ")}</p>
      <h3>hola</h3>
    </div>
  );
}
