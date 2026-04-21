import React, { useState } from "react";
import "./HomePage.css";
import RepoForm from "./components/repository";
import SplSelector from "./components/splSelector";
import OptionPanel from "./components/optionPanel";
import OptionSummary from "./components/optionSummary";

function App() {
  const [repoSource, setRepoSource] = useState("");
  const [sourceType, setSourceType] = useState("github");
  const [submittedSource, setSubmittedSource] = useState("");
  const [submittedSourceType, setSubmittedSourceType] = useState("github");
  const [selectedSpl, setSelectedSpl] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (repoSource.trim() === "") return;
    setSubmittedSource(repoSource.trim());
    setSubmittedSourceType(sourceType);
  };

  return (
    <div className="main-container">
      <div className="inner-box fade-in">
        <h3 className="dynamic-title">Welcome to Our Tool</h3>
        <p className="subtitle">Choose an SPL option below</p>

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
      </div>
    </div>
  );
}

export default App;