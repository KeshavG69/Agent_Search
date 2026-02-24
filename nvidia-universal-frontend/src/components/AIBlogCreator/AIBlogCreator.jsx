"use client";
import React, { useState } from 'react';
import genai_new_logo from '../../assets/genai_new_logo.png';
import { Upload, FileText,RefreshCcwDot, Sparkles, Copy, Download, AlertCircle, CheckCircle, Loader, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import './AIBlogCreator.css';

const AIBlogCreator = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [blogTopic, setBlogTopic] = useState('');
  const [namespace, setNamespace] = useState('');
  const [generatedBlog, setGeneratedBlog] = useState('');
  const [outline, setOutline] = useState('');
  const [questions, setQuestions] = useState('');
  const [review, setReview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('blog');
  const [showOutput, setShowOutput] = useState(false);
  const [generationSteps, setGenerationSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  // API base URL
  const API_BASE_URL = 'http://127.0.0.1:8000';

  // Generation steps
  const steps = [
    { id: 1, label: 'Analyzing document context...' },
    { id: 2, label: 'Generating blog outline...' },
    { id: 3, label: 'Creating relevant questions...' },
    { id: 4, label: 'Retrieving context from document...' },
    { id: 5, label: 'Writing blog content...' },
    { id: 6, label: 'Reviewing and refining...' },
    { id: 7, label: 'Finalizing blog post...' }
  ];

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadSuccess(false);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE_URL}/ingest`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setNamespace(data.namespace);
      setUploadSuccess(true);
      setError('');
      console.log('Upload successful. Namespace:', data.namespace);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file. Please try again.');
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateBlog = async () => {
    if (!blogTopic) {
      setError('Please enter a blog topic');
      return;
    }

    if (!namespace) {
      setError('Please upload a document first');
      return;
    }

    setIsGenerating(true);
    setError('');
    setShowOutput(false);
    setGeneratedBlog('');
    setOutline('');
    setQuestions('');
    setReview('');
    setCurrentStep(0);
    
    // Initialize all steps as pending
    setGenerationSteps(steps.map(step => ({ ...step, status: 'pending' })));

    try {
      const formData = new FormData();
      formData.append('topic', blogTopic);
      formData.append('namespace', namespace);

      const response = await fetch(`${API_BASE_URL}/generate-blog`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate blog post');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.complete) {
                // All data received
                setGeneratedBlog(data.blog_post || '');
                setOutline(data.outline || '');
                setQuestions(data.questions || '');
                setReview(data.review || '');
                setActiveTab('blog');
                
                setTimeout(() => {
                  setShowOutput(true);
                  setIsGenerating(false);
                }, 500);
              } else if (data.step) {
                const stepIndex = data.step - 1;
                setCurrentStep(stepIndex);

                setGenerationSteps(prev =>
                  prev.map((step, idx) => {
                    if (idx < stepIndex) {
                      return { ...step, status: 'completed' };
                    } else if (idx === stepIndex) {
                      return { ...step, status: data.status || 'active' };
                    } else {
                      return { ...step, status: 'pending' };
                    }
                  })
                );

                // Store intermediate data
                if (data.data) {
                  if (data.data.outline) setOutline(data.data.outline);
                  if (data.data.questions) setQuestions(data.data.questions);
                  if (data.data.blog_post) setGeneratedBlog(data.data.blog_post);
                  if (data.data.review) setReview(data.data.review);
                }
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      console.log('Blog generation successful');
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate blog post. Please try again.');
      setShowOutput(false);
      setIsGenerating(false);
    }
  };

  const handleCopyBlog = () => {
    let contentToCopy = '';
    switch (activeTab) {
      case 'blog':
        contentToCopy = generatedBlog;
        break;
      case 'outline':
        contentToCopy = outline;
        break;
      case 'questions':
        contentToCopy = questions;
        break;
      case 'review':
        contentToCopy = review;
        break;
      default:
        contentToCopy = generatedBlog;
    }

    navigator.clipboard.writeText(contentToCopy);
    const copyButton = document.activeElement;
    const originalText = copyButton.innerHTML;
    copyButton.innerHTML = '<svg class="lucide lucide-check" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied!';
    setTimeout(() => {
      copyButton.innerHTML = originalText;
    }, 2000);
  };

  const handleDownloadBlog = () => {
    let contentToDownload = '';
    let filename = '';
    
    switch (activeTab) {
      case 'blog':
        contentToDownload = generatedBlog;
        filename = `${blogTopic.replace(/\s+/g, '-').toLowerCase()}-blog.md`;
        break;
      case 'outline':
        contentToDownload = outline;
        filename = `${blogTopic.replace(/\s+/g, '-').toLowerCase()}-outline.md`;
        break;
      case 'questions':
        contentToDownload = questions;
        filename = `${blogTopic.replace(/\s+/g, '-').toLowerCase()}-questions.md`;
        break;
      case 'review':
        contentToDownload = review;
        filename = `${blogTopic.replace(/\s+/g, '-').toLowerCase()}-review.md`;
        break;
      default:
        contentToDownload = generatedBlog;
        filename = `${blogTopic.replace(/\s+/g, '-').toLowerCase()}-blog.md`;
    }

    const element = document.createElement('a');
    const file = new Blob([contentToDownload], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'blog':
        return generatedBlog;
      case 'outline':
        return outline;
      case 'questions':
        return questions;
      case 'review':
        return review;
      default:
        return generatedBlog;
    }
  };

  return (
    <div className="ai-blog-creator">
      <div className="header">
        <h1 className="title"><span style={{color:"#76b900"}}>NVIDIA AI</span> Blog Creator</h1>
        <p className="subtitle">
          Transform your documents into compelling blog posts using advanced AI agents
        </p>
        {/* <div className="powered-by">
          <span className="powered-text">Powered by</span>
          <a href="https://genaiprotos.com" target="_blank" rel="noopener noreferrer" className="brand-link">
            <img src={genai_new_logo} alt="GenAI Protos Logo" className="brand-logo" />
          </a>
        </div> */}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-container">
          <div className="error-message">
            <AlertCircle size={20} strokeWidth={2} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Generation Progress Loader */}
      {isGenerating && (
        <div className="generation-overlay">
          <div className="generation-modal">
            <div className="generation-header">
              <RefreshCcwDot className="generation-icon" size={32} strokeWidth={2} />
              <h3 className="generation-title">Generating Your Blog Post</h3>
              <p className="generation-subtitle">Please wait while our AI agents work on your content...</p>
            </div>
            
            <div className="steps-container">
              {generationSteps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`step-item ${step.status}`}
                >
                  <div className="step-indicator">
                    {step.status === 'completed' ? (
                      <Check size={16} strokeWidth={3} />
                    ) : step.status === 'active' ? (
                      <Loader className="step-spinner" size={16} strokeWidth={3} />
                    ) : (
                      <div className="step-dot"></div>
                    )}
                  </div>
                  <div className="step-content">
                    <span className="step-label">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ 
                  width: `${((currentStep + 1) / steps.length) * 100}%` 
                }}
              ></div>
            </div>
            <p className="progress-text">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </div>
      )}

      <div className="content-container">
        {/* Upload Document Section */}
        <div className="card">
          <div className="card-header">
            <Upload className="header-icon" size={20} strokeWidth={2.5} />
            <h2 className="card-title">Upload Document</h2>
          </div>
          <p className="card-description">
            Upload your source document to begin the blog creation process
          </p>

          <div className="upload-area">
            <FileText className="document-icon" size={80} strokeWidth={1.5} />
            <div className="file-input-wrapper">
              <label htmlFor="file-upload" className="file-input-label">
                Choose File
              </label>
              <input
                type="file"
                id="file-upload"
                className="file-input"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.md"
              />
              <span className="file-status">
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
            </div>
          </div>

          {uploadSuccess && (
            <div className="success-message">
              <CheckCircle size={18} strokeWidth={2} />
              <span>Document uploaded successfully!</span>
            </div>
          )}

          <button 
            className="upload-button" 
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? (
              <>
                <Loader className="button-icon spinner" size={18} strokeWidth={2.5} />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="button-icon" size={18} strokeWidth={2.5} />
                Upload & Process
              </>
            )}
          </button>
        </div>

        {/* Generate Blog Post Section */}
        <div className="card">
          <div className="card-header">
            <RefreshCcwDot className="header-icon sparkle" size={20} strokeWidth={2.5} />
            <h2 className="card-title">Generate Blog Post</h2>
          </div>
          <p className="card-description">
            Enter a topic to generate your AI-powered blog post
          </p>

          <div className="form-group">
            <label className="form-label">Blog Topic</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., The Future of Artificial Intelligence"
              value={blogTopic}
              onChange={(e) => setBlogTopic(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Namespace (from upload)</label>
            <input
              type="text"
              className="form-input disabled"
              placeholder="Automatically filled after upload"
              value={namespace}
              readOnly
              disabled
            />
          </div>

          <button 
            className="generate-button" 
            onClick={handleGenerateBlog}
            disabled={isGenerating || !blogTopic || !namespace}
          >
            {isGenerating ? (
              <>
                <Loader className="button-icon spinner" size={18} strokeWidth={2.5} />
                Generating...
              </>
            ) : (
              <>
                <RefreshCcwDot className="button-icon" size={18} strokeWidth={2.5} />
                Generate Blog Post
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Blog Display Section */}
      {showOutput && (
        <div className="blog-output-container">
          <div className="blog-output-card">
            <div className="blog-output-header">
              <div className="blog-output-title-section">
                <FileText className="blog-output-icon" size={24} strokeWidth={2} />
                <h2 className="blog-output-title">Generated Content</h2>
              </div>
              <div className="blog-actions">
                <button className="action-button" onClick={handleCopyBlog} title="Copy to clipboard">
                  <Copy size={18} strokeWidth={2} />
                  Copy
                </button>
                <button className="action-button" onClick={handleDownloadBlog} title="Download as markdown">
                  <Download size={18} strokeWidth={2} />
                  Download
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
              <button 
                className={`tab ${activeTab === 'blog' ? 'active' : ''}`}
                onClick={() => setActiveTab('blog')}
              >
                Blog Post
              </button>
              <button 
                className={`tab ${activeTab === 'outline' ? 'active' : ''}`}
                onClick={() => setActiveTab('outline')}
              >
                Outline
              </button>
              <button 
                className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
                onClick={() => setActiveTab('questions')}
              >
                Questions
              </button>
              <button 
                className={`tab ${activeTab === 'review' ? 'active' : ''}`}
                onClick={() => setActiveTab('review')}
              >
                Review
              </button>
            </div>

            <div className="blog-content">
              {renderContent() ? (
                <div className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  >
                    {renderContent()}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="no-content">
                  <p>No content available for this tab.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIBlogCreator;
