import React, { useEffect, useState } from "react";
import "./HomePage.css";
import RepoForm from "./components/repository";
import SplSelector from "./components/splSelector";
import OptionPanel from "./components/optionPanel";
import OptionSummary from "./components/optionSummary";
import { useNavigate } from "react-router-dom";
import { fetchReports } from "./api";
import { User } from 'lucide-react';

function App() {
  const navigate = useNavigate();
  const [repoSource, setRepoSource] = useState("");
  const [sourceType, setSourceType] = useState("github");
  const [submittedSource, setSubmittedSource] = useState("");
  const [submittedSourceType, setSubmittedSourceType] = useState("github");
  const [selectedSpl, setSelectedSpl] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportError, setReportError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("current_user");
    if (!storedUser) return;
    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchReports()
        .then(setReports)
        .catch((err) => setReportError(err.message));
    } catch {
      setUser(null);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (repoSource.trim() === "") return;
    setSubmittedSource(repoSource.trim());
    setSubmittedSourceType(sourceType);
  };

  return (
    <div className="main-container">
      <div className="inner-box fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 className="dynamic-title">Welcome to Our Tool</h3>
          {user && (
            <button onClick={() => navigate("/profile")} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <User size={24} />
            </button>
          )}
        </div>
        {user && (
          <p className="subtitle">
            Logged in as {user.email} ({user.role})
            {user.batch && user.roll ? ` — batch ${user.batch}, roll ${user.roll}` : ""}
          </p>
        )}
        <p className="subtitle">Choose an SPL option below</p>
        {user?.role === "teacher" && (
          <button
            onClick={() => navigate("/compare")}
            style={{
            backgroundColor: 'transparent',
            border: '1px solid white',
            marginBottom: '15px'
            }}
          >
            Go to Compare Page
          </button>
        )}

        <RepoForm
          repoSource={repoSource}
          setRepoSource={setRepoSource}
          sourceType={sourceType}
          setSourceType={setSourceType}
          handleSubmit={handleSubmit}
          submittedSource={submittedSource}
          submittedSourceType={submittedSourceType}
        />

        <div className="horizontal-flow">
          {!showSummary ? (
            <>
              <div className="flow-section flow-section-spl">
                <SplSelector
                  selectedSpl={selectedSpl}
                  setSelectedSpl={setSelectedSpl}
                />
              </div>
              {selectedSpl && (
                <div className="flow-section flow-section-options">
                  <OptionPanel
                    spl={selectedSpl}
                    setShowSummary={setShowSummary}
                    setSelectedOptions={setSelectedOptions}
                    repoSource={repoSource}
                    sourceType={sourceType}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flow-section flow-section-summary">
              <OptionSummary selectedOptions={selectedOptions} />
            </div>
          )}
        </div>
        {user && (
          <div style={{ marginTop: 24, textAlign: "left" }}>
            <h4>{user.role === "teacher" ? "All Reports" : "Your Reports"}</h4>
            {reportError && <p style={{ color: "crimson" }}>{reportError}</p>}
            {!reports.length && !reportError && <p>No saved reports yet.</p>}
            {!!reports.length && (
              <>
                <p>Total reports: {reports.length}</p>
                <ul>
                  {reports.slice(0, 3).map((report) => (
                    <li key={report.id}>
                      {report.userEmail} | {report.repository} | batch {report.batch ?? "N/A"}
                      {report.roll ? ` / roll ${report.roll}` : ""}
                    </li>
                  ))}
                </ul>
                {reports.length > 3 && <p>... and {reports.length - 3} more</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;