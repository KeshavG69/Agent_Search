import React, { useState } from 'react';
import './UploadSection.css';

function UploadSection({ setDocumentId, isProcessing, setIsProcessing }) {
  const [uploadMode, setUploadMode] = useState('file');
  const [selectedFile, setSelectedFile] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUploadAndProcess = async () => {
    setError('');
    setIsProcessing(true);

    try {
      const formData = new FormData();
      
      if (uploadMode === 'file') {
        if (!selectedFile) {
          setError('Please select a file first');
          setIsProcessing(false);
          return;
        }
        formData.append('file', selectedFile);
      } else {
        if (!urlInput.trim()) {
          setError('Please enter a URL');
          setIsProcessing(false);
          return;
        }
        formData.append('source_url', urlInput);
      }

      const response = await fetch('http://localhost:8000/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const data = await response.json();
      setDocumentId(data.document_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="upload-section">
      <h1 className="main-title">Agentic RAG with voice-based output</h1>
      <div className="upload-card">
        <h2 className="upload-title">Upload Document</h2>
        <p className="upload-subtitle">Upload a document or provide a URL to get started</p>

        <div className="upload-mode-buttons">
          <button
            className={`mode-button ${uploadMode === 'file' ? 'active' : ''}`}
            onClick={() => setUploadMode('file')}
          >
            <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            Upload File
          </button>
          <button
            className={`mode-button ${uploadMode === 'url' ? 'active' : ''}`}
            onClick={() => setUploadMode('url')}
          >
            <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            From URL
          </button>
        </div>

        {uploadMode === 'file' ? (
          <div className="file-upload-section">
            <label className="file-label">Choose File</label>
            <div className="file-input-container">
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileSelect}
                className="file-input-hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-input-label">
                Choose File
              </label>
              <span className="file-name">
                {selectedFile ? selectedFile.name : 'Simple Project Documentation[1].pdf'}
              </span>
            </div>
            {selectedFile && (
              <p className="selected-file">Selected: {selectedFile.name}</p>
            )}
          </div>
        ) : (
          <div className="url-input-section">
            <label className="file-label">Document URL</label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/document.pdf"
              className="url-input"
            />
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        <button
          className="upload-process-button"
          onClick={handleUploadAndProcess}
          disabled={isProcessing}
        >
          <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          {isProcessing ? 'Processing...' : 'Upload & Process'}
        </button>
      </div>
    </div>
  );
}

export default UploadSection;
