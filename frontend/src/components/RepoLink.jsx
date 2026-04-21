import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import './RepoLink.css';
import { analyzeGithubRepo } from '../api';

export default function RepoLink() {
    const [repoSource, setRepoSource] = useState('');
    const [sourceType, setSourceType] = useState('github');
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');

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

    return (
        <div className="repo-input-wrapper">
            <div className="repo-input-container">
                <div className={`input-box ${repoSource.trim() ? 'has-content' : ''}`}>
                    <select
                        value={sourceType}
                        onChange={(e) => setSourceType(e.target.value)}
                        className="repo-textarea"
                        style={{ maxWidth: '180px', marginBottom: '8px' }}
                    >
                        <option value="github">Repo link</option>
                        <option value="local">Local path</option>
                    </select>
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