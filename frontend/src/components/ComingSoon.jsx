import React from "react";

export default function ComingSoon({ title }) {
  return (
    <div className="metric-card coming-soon" style={{
      background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
      opacity: 0.7,
      cursor: "not-allowed",
      position: "relative"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "250px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🚀</div>
        <h3 style={{ 
          fontSize: "18px", 
          fontWeight: "600", 
          color: "#495057",
          margin: "8px 0"
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: "14px",
          color: "#868e96",
          margin: "8px 0 0 0"
        }}>
          Coming soon!
        </p>
      </div>
    </div>
  );
}
