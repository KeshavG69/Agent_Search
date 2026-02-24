"use client";

import React, { useState, useRef } from 'react';
import './PodcastGenerator.css';

const PodcastGenerator = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMonologue, setIsMonologue] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [podcastUrl, setPodcastUrl] = useState(null);
  const [progressSteps, setProgressSteps] = useState([]);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      if (droppedFile.size <= 50 * 1024 * 1024) {
        setFile(droppedFile);
        setError('');
        setPodcastUrl(null);
        setProgressSteps([]);
      } else {
        setError('File size exceeds 50MB limit');
      }
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (selectedFile.size <= 50 * 1024 * 1024) {
        setFile(selectedFile);
        setError('');
        setPodcastUrl(null);
        setProgressSteps([]);
      } else {
        setError('File size exceeds 50MB limit');
      }
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const addProgressStep = (step, status = 'in-progress') => {
    setProgressSteps(prev => {
      const existing = prev.find(s => s.step === step);
      if (existing) {
        return prev.map(s => s.step === step ? { ...s, status } : s);
      }
      return [...prev, { step, status, timestamp: Date.now() }];
    });
  };

  const handleGeneratePodcast = async () => {
    if (!file) {
      setError('Please upload a PDF file first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setPodcastUrl(null);
    setProgressSteps([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const url = `http://localhost:8000/generate-podcast?is_monologue=${isMonologue}`;

      addProgressStep('Uploading PDF document...', 'in-progress');
      
      // Simulate progress steps based on typical backend flow
      setTimeout(() => addProgressStep('Uploading PDF document...', 'completed'), 500);
      setTimeout(() => addProgressStep('Converting PDF to Markdown using docling...', 'in-progress'), 600);
      setTimeout(() => addProgressStep('Converting PDF to Markdown using docling...', 'completed'), 3000);
      setTimeout(() => addProgressStep('Generating podcast dialogue with AI...', 'in-progress'), 3100);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate podcast';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      addProgressStep('Generating podcast dialogue with AI...', 'completed');
      addProgressStep('Converting dialogue to speech with OpenAI TTS...', 'in-progress');
      
      const blob = await response.blob();
      
      addProgressStep('Converting dialogue to speech with OpenAI TTS...', 'completed');
      addProgressStep('Finalizing audio file...', 'completed');
      
      const audioUrl = window.URL.createObjectURL(blob);
      setPodcastUrl(audioUrl);

    } catch (err) {
      console.error('Error generating podcast:', err);
      setError(err.message || 'An error occurred while generating the podcast');
      setProgressSteps([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (podcastUrl) {
      const a = document.createElement('a');
      a.href = podcastUrl;
      a.download = `podcast_${file.name.replace('.pdf', '')}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleNewPodcast = () => {
    setFile(null);
    setPodcastUrl(null);
    setProgressSteps([]);
    setError('');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="podcast-generator-container">
      <div className="podcast-generator-card">
        <h1 className="title">PDF TO PODCAST GENERATOR</h1>
        <p className="subtitle">Transform your PDFs into engaging audio podcasts powered by NVIDIA AI</p>

        {!podcastUrl ? (
          <>
            <div className="upload-section">
              <h2 className="section-title">Upload PDF Document</h2>
              
              <div
                className={`dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={!isGenerating ? handleBrowseClick : undefined}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf"
                  style={{ display: 'none' }}
                  disabled={isGenerating}
                />
                
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                
                {file ? (
                  <div className="file-info">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <p className="dropzone-text">Drop your PDF here or click to browse</p>
                    <p className="dropzone-subtext">Supports PDF files up to 50MB</p>
                  </>
                )}
              </div>

              {error && <p className="error-message">{error}</p>}
            </div>

            {isGenerating && progressSteps.length > 0 && (
              <div className="progress-container">
                <h3 className="progress-title">Generating Your Podcast...</h3>
                <div className="progress-steps">
                  {progressSteps.map((item, index) => (
                    <div key={index} className={`progress-step ${item.status}`}>
                      <div className="step-indicator">
                        {item.status === 'completed' ? (
                          <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="spinner-small"></div>
                        )}
                      </div>
                      <span className="step-text">{item.step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="style-section">
              <div className="style-header">
                <div>
                  <h3 className="style-title">Podcast Style</h3>
                  <p className="style-description">
                    {isMonologue ? 'Single host monologue' : 'Two-host conversation'}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isMonologue}
                    onChange={(e) => setIsMonologue(e.target.checked)}
                    disabled={isGenerating}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <button
              className="generate-button"
              onClick={handleGeneratePodcast}
              disabled={isGenerating || !file}
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  Generating Podcast...
                </>
              ) : (
                'Generate Podcast'
              )}
            </button>
          </>
        ) : (
          <div className="podcast-player-section">
            <div className="success-message">
              <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3>Podcast Generated Successfully!</h3>
              <p>Your podcast is ready to listen and download</p>
            </div>

            <div className="audio-player">
              <audio ref={audioRef} controls className="audio-element">
                <source src={podcastUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>

            <div className="action-buttons">
              <button className="download-button" onClick={handleDownload}>
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Podcast
              </button>
              <button className="new-podcast-button" onClick={handleNewPodcast}>
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate New Podcast
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PodcastGenerator;