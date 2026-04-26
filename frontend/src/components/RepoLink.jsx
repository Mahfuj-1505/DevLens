import React, { useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import './RepoLink.css';
import { analyzeGithubRepo } from '../api';

export default function RepoLink() {
    const [repoSource, setRepoSource] = useState('');
    const [sourceType, setSourceType] = useState('github');
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [activeSourceTypeDropdown, setActiveSourceTypeDropdown] = useState(false);
    const sourceTypeDropdownRef = useRef(null);

    const sourceTypeOptions = [
        { value: "github", label: "Repo link" },
        { value: "local", label: "Local path" },
    ];

    const handleSubmit = async () => {
        if (repoSource.trim()) {
            try {
                setLoading(true);
                setStatusText('Running analysis...');
                const result = await analyzeGithubRepo({ sourceType, value: repoSource.trim() });
                setStatusText(`Done. JSON: ${result.jsonOutputPath}`);
            } catch (error) {
                setStatusText(`Failed: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

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
        <div className="repo-input-wrapper">
            <div className="repo-input-container">
                <div className={`input-box ${repoSource.trim() ? 'has-content' : ''}`}>
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
                    <textarea 
                        value={repoSource}
                        onChange={(e) => setRepoSource(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={sourceType === 'local' ? 'Paste local repository path...' : 'Paste repository link...'}
                        className="repo-textarea"
                        rows={1}
                    />
          
                    <button 
                        onClick={handleSubmit}
                        disabled={!repoSource.trim() || loading}
                        className={`submit-button ${repoSource.trim() ? 'active' : 'disabled'}`}
                    >
                        <ArrowUp className="arrow-icon" />
                    </button>
                </div>
                {statusText && <p>{statusText}</p>}
            </div>
        </div>
    );
}