import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import './RepoLink.css';

export default function RepoLink() {
    const [repolink, setRepoLink] = useState('');

    const handleSubmit = () => {
        if (repolink.trim()) {
            console.log('Submitted:', repolink);
            // Handle submission here
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
                        disabled={!repolink.trim()}
                        className={`submit-button ${repolink.trim() ? 'active' : 'disabled'}`}
                    >
                        <ArrowUp className="arrow-icon" />
                    </button>
                </div>
            </div>
        </div>
    );
}