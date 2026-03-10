import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import './RepoLink.css';
import { analyzeGithubRepo } from '../api';

export default function RepoLink() {
    const [repolink, setRepoLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');

    const handleSubmit = async () => {
        if (repolink.trim()) {
            try {
                setLoading(true);
                setStatusText('Running analysis...');
                const result = await analyzeGithubRepo(repolink.trim());
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

    return (
        <div className="repo-input-wrapper">
            <div className="repo-input-container">
                <div className={`input-box ${repolink.trim() ? 'has-content' : ''}`}>
                    <textarea 
                        value={repolink}
                        onChange={(e) => setRepoLink(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Paste repository link..."
                        className="repo-textarea"
                        rows={1}
                    />
          
                    <button 
                        onClick={handleSubmit}
                        disabled={!repolink.trim() || loading}
                        className={`submit-button ${repolink.trim() ? 'active' : 'disabled'}`}
                    >
                        <ArrowUp className="arrow-icon" />
                    </button>
                </div>
                {statusText && <p>{statusText}</p>}
            </div>
        </div>
    );
}