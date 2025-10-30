import React, { useState } from "react";
import "./HomePage.css";
import RepoForm from "./components/repository";
import SplSelector from "./components/splSelector";
import OptionPanel from "./components/optionPanel";
import OptionSummary from "./components/optionSummary";

function App() {
  const [repoLink, setRepoLink] = useState("");
  const [submittedLink, setSubmittedLink] = useState("");
  const [selectedSpl, setSelectedSpl] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (repoLink.trim() === "") return;
    setSubmittedLink(repoLink);
    setRepoLink("");
  };

  return (
    <div className="main-container">
      <div className="inner-box fade-in">
        <h3 className="dynamic-title">Welcome to Our Tool</h3>
        <p className="subtitle">Choose an SPL option below</p>

        <RepoForm
          repoLink={repoLink}
          setRepoLink={setRepoLink}
          handleSubmit={handleSubmit}
          submittedLink={submittedLink}
        />

        <div className="horizontal-flow">
          {!showSummary ? (
            <>
              <SplSelector
                selectedSpl={selectedSpl}
                setSelectedSpl={setSelectedSpl}
              />
              {selectedSpl && (
                <OptionPanel
                  spl={selectedSpl}
                  setShowSummary={setShowSummary}
                  setSelectedOptions={setSelectedOptions}
                />
              )}
            </>
          ) : (
            <OptionSummary selectedOptions={selectedOptions} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
