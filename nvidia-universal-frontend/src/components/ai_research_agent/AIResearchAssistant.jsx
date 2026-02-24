import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AIResearchAssistant.css';
import { Upload, FileText, Folder, Search, Copy, ArrowDownToLine, Key, CheckCircle, Brain, Database, Globe, FileCheck } from 'lucide-react';
import GenaiLogo from '../../assets/genai_new_logo.png';

const AIResearchAssistant = () => {
  const [researchQuestion, setResearchQuestion] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [namespace, setNamespace] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [loadingSteps, setLoadingSteps] = useState([]);

  // Add your backend URL here - adjust port if needed
  const BACKEND_URL = 'http://localhost:8000';

  // Supported file formats - only PDF, DOC, DOCX, TXT
  const supportedFormats = ['pdf', 'doc', 'docx', 'txt'];
  const acceptString = '.pdf,.doc,.docx,.txt';

  // Default loading steps (fallback)
  const defaultLoadingSteps = [
    { icon: Database, text: "Analyzing uploaded document...", completed: false },
    { icon: Brain, text: "Creating execution plan...", completed: false },
    { icon: Search, text: "Searching document content...", completed: false },
    { icon: Globe, text: "Gathering web information...", completed: false },
    { icon: FileCheck, text: "Synthesizing comprehensive report...", completed: false }
  ];

  // Helper function to validate file type
  const isValidFileType = (file) => {
    if (!file) return false;
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      if (isValidFileType(file)) {
        setSelectedFile(file);
        setError(''); // Clear any previous errors
        console.log(file);
      } else {
        setError('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files only.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (isValidFileType(file)) {
        setSelectedFile(file);
        setError(''); // Clear any previous errors
        console.log(file);
      } else {
        setError('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files only.');
        // Reset the input
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    }
  };

  const handleBrowseClick = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    if (!bytes && bytes !== 0) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setNamespace('');
    setUploadedFileName('');
    setUploadSuccess(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setError('');
    setUploadSuccess(false);
    setNamespace('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${BACKEND_URL}/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.namespace && data.filename) {
        setNamespace(data.namespace);
        setUploadedFileName(data.filename);
        setUploadSuccess(true);
      } else {
        throw new Error('No namespace received from server');
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      setError(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedReport) return;
    try {
      await navigator.clipboard.writeText(generatedReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleDownload = () => {
    if (!generatedReport) return;
    const blob = new Blob([generatedReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (researchQuestion || 'research-report').toLowerCase().replace(/[^a-z0-9]+/gi, '-');
    a.href = url;
    a.download = `${safeName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Function to handle streaming progress updates
  const handleStreamingProgress = async (prompt, namespaceValue) => {
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('namespace', namespaceValue);

      const response = await fetch(`${BACKEND_URL}/query-stream/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Process complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setProgress(data.progress || 0);
                setCurrentStepText(data.step || '');
                
                if (data.step_index !== undefined) {
                  setCurrentStep(data.step_index);
                }
                
                // Update steps if provided
                if (data.steps) {
                  setLoadingSteps(data.steps.map((step, index) => ({
                    icon: getStepIcon(step.type || 'default'),
                    text: step.text,
                    completed: step.completed || false
                  })));
                }
              } else if (data.type === 'complete') {
                setProgress(100);
                setGeneratedReport(data.report || '');
                setTimeout(() => {
                  setIsGenerating(false);
                  setCurrentStep(-1);
                  setProgress(0);
                }, 500);
                return;
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Unknown error occurred');
              }
            } catch (parseError) {
              console.warn('Failed to parse progress data:', parseError);
            }
          }
        }
        
        // Keep the last incomplete line in buffer
        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  };

  // Helper function to get appropriate icon for step type
  const getStepIcon = (stepType) => {
    const iconMap = {
      'analyze': Database,
      'plan': Brain,
      'search': Search,
      'web': Globe,
      'synthesize': FileCheck,
      'default': FileText
    };
    return iconMap[stepType] || FileText;
  };

  const handleGenerateReport = async () => {
    if (isGenerating || !canQuery) return;
    
    // Validate inputs
    if (!namespace.trim()) {
      setError('Please upload a file first to get a namespace, or enter a valid namespace');
      return;
    }
    
    if (!researchQuestion.trim()) {
      setError('Please enter a research question');
      return;
    }

    setIsGenerating(true);
    setError('');
    setCopied(false);
    setGeneratedReport('');
    setCurrentStep(0);
    setProgress(0);
    setCurrentStepText('Starting analysis...');
    setLoadingSteps(defaultLoadingSteps);

    try {
      // Check if streaming endpoint is available
      const streamEndpointExists = await checkStreamingEndpoint();
      
      if (streamEndpointExists) {
        // Use streaming approach
        await handleStreamingProgress(researchQuestion.trim(), namespace.trim());
      } else {
        // Fallback to regular approach with simulated progress
        await handleRegularProgress(researchQuestion.trim(), namespace.trim());
      }

    } catch (error) {
      console.error('Error generating report:', error);
      setError(`Failed to generate report: ${error.message}`);
      setTimeout(() => {
        setIsGenerating(false);
        setCurrentStep(-1);
        setProgress(0);
      }, 500);
    }
  };

  // Check if streaming endpoint exists
  const checkStreamingEndpoint = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/query-stream/`, {
        method: 'OPTIONS'
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Fallback regular progress with simulation
  const handleRegularProgress = async (prompt, namespaceValue) => {
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        return prev + Math.random() * 5;
      });
    }, 300);

    // Simulate step progression
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < defaultLoadingSteps.length - 1) {
          const nextStep = prev + 1;
          setCurrentStepText(defaultLoadingSteps[nextStep].text);
          return nextStep;
        }
        return prev;
      });
    }, 2000);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('namespace', namespaceValue);

      const response = await fetch(`${BACKEND_URL}/query/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.report) {
        clearInterval(progressInterval);
        clearInterval(stepInterval);
        setProgress(100);
        setTimeout(() => {
          setGeneratedReport(data.report);
          setTimeout(() => {
            setIsGenerating(false);
            setCurrentStep(-1);
            setProgress(0);
          }, 500);
        }, 500);
      } else {
        throw new Error('No report data received from server');
      }
    } catch (error) {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      throw error;
    }
  };

  const handleClearAll = () => {
    setResearchQuestion('');
    setSelectedFile(null);
    setNamespace('');
    setUploadedFileName('');
    setGeneratedReport('');
    setIsUploading(false);
    setIsGenerating(false);
    setCopied(false);
    setError('');
    setUploadSuccess(false);
    setCurrentStep(-1);
    setProgress(0);
    setCurrentStepText('');
    setLoadingSteps([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const canUpload = selectedFile && !isUploading && !uploadSuccess;
  const canQuery = researchQuestion.trim().length > 0 && namespace.trim().length > 0;

  // Custom components for ReactMarkdown
  const markdownComponents = {
    h1: ({children}) => <h1 className="markdown-h1">{children}</h1>,
    h2: ({children}) => <h2 className="markdown-h2">{children}</h2>,
    h3: ({children}) => <h3 className="markdown-h3">{children}</h3>,
    h4: ({children}) => <h4 className="markdown-h4">{children}</h4>,
    h5: ({children}) => <h5 className="markdown-h5">{children}</h5>,
    h6: ({children}) => <h6 className="markdown-h6">{children}</h6>,
    p: ({children}) => <p className="markdown-paragraph">{children}</p>,
    ul: ({children}) => <ul className="markdown-ul">{children}</ul>,
    ol: ({children}) => <ol className="markdown-ol">{children}</ol>,
    li: ({children}) => <li className="markdown-li">{children}</li>,
    blockquote: ({children}) => <blockquote className="markdown-blockquote">{children}</blockquote>,
    code: ({inline, children}) => {
      if (inline) {
        return <code className="markdown-code-inline">{children}</code>;
      }
      return <code className="markdown-code-block">{children}</code>;
    },
    pre: ({children}) => <pre className="markdown-pre">{children}</pre>,
    table: ({children}) => <table className="markdown-table">{children}</table>,
    thead: ({children}) => <thead className="markdown-thead">{children}</thead>,
    tbody: ({children}) => <tbody className="markdown-tbody">{children}</tbody>,
    tr: ({children}) => <tr className="markdown-tr">{children}</tr>,
    td: ({children}) => <td className="markdown-td">{children}</td>,
    th: ({children}) => <th className="markdown-th">{children}</th>,
    a: ({href, children}) => <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">{children}</a>,
    strong: ({children}) => <strong className="markdown-strong">{children}</strong>,
    em: ({children}) => <em className="markdown-em">{children}</em>,
    hr: () => <hr className="markdown-hr" />
  };

  return (
    <div className="ai-research-container">
      <div className="header">
        {/* <div className="header-icon">
          <div className="brain-icon"><Search /></div>
        </div> */}
        <div className="header-content">
          <h1 className="title">NVIDIA Research <span style={{color:"#76b900"}}>Copilot</span></h1>
          <p className="subtitle">Upload a document and ask questions to generate comprehensive research reports</p>
          {/* <div className="powered-by">
            <span>Powered by</span>
            <a href="https://genaiprotos.com" target="_blank" rel="noopener noreferrer" className="genai-link"><img src={GenaiLogo} alt="GenAI Logo" /></a>
            
          </div> */}
        </div>
      </div>

      <div className="content-wrapper">
        <div className="input-sections">
          <div className="research-section">
            <div className="section-header">
              <span className="section-icon"><Search /></span>
              <h2 className="section-title">Research Question</h2>
            </div>
            <div className="input-container">
              <textarea
                className="research-input"
                placeholder="What would you like to research? Be specific about what insights you're looking for..."
                value={researchQuestion}
                onChange={(e) => setResearchQuestion(e.target.value)}
                rows={6}
              />
            </div>
            
            {/* Document Namespace Section within Research Question */}
            <div className="namespace-container">
              <div className="namespace-header">
                <span className="namespace-icon"><Key size={18} /></span>
                <label className="namespace-label">Document Namespace</label>
              </div>
              <div className="namespace-input-wrapper">
                <input
                  type="text"
                  className="namespace-input"
                  placeholder="Namespace will appear here after upload, or paste your existing namespace"
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  readOnly={uploadSuccess}
                />
                {uploadSuccess && (
                  <span className="namespace-success-indicator">
                    <CheckCircle size={16} color="#10b981" />
                  </span>
                )}
              </div>
              <p className="namespace-help">
                {uploadSuccess 
                  ? `✓ Namespace generated from: ${uploadedFileName}` 
                  : 'Upload a file to get a namespace, or paste an existing namespace from a previous upload'}
              </p>
            </div>
          </div>

          <div className="upload-section">
            <div className="section-header">
              <span className="section-icon"><FileText /></span>
              <h2 className="section-title">Document Upload</h2>
            </div>
            <div 
              className={`upload-container ${dragActive ? 'drag-active' : ''} ${uploadSuccess ? 'upload-success' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={!uploadSuccess ? handleBrowseClick : undefined}
            >
              <div className="upload-icon">
                {uploadSuccess ? <CheckCircle size={40} color="#10b981" /> : <Upload size={40} />}
              </div>
              <h3 className="upload-title">
                {uploadSuccess ? 'File Uploaded Successfully!' : 'Upload a document'}
              </h3>
              <p className="upload-subtitle">
                {uploadSuccess ? `${uploadedFileName} is ready for querying` : 'Drag and drop or click to browse'}
              </p>
              {!uploadSuccess && <p className="upload-formats">Supports PDF, DOC, DOCX, TXT</p>}
              
              {selectedFile && (
                <div className="file-chip" onClick={(e) => e.stopPropagation()}>
                  <div className="file-chip-info">
                    <span className="file-check">{uploadSuccess ? '✓' : '📄'}</span>
                    <div className="file-meta">
                      <div className="file-name" title={selectedFile.name}>{selectedFile.name}</div>
                      <div className="file-size">{formatBytes(selectedFile.size)}</div>
                    </div>
                  </div>
                  <button className="file-remove" onClick={handleRemoveFile} aria-label="Remove file">×</button>
                </div>
              )}

              {!uploadSuccess && (
                <>
                  <input
                    type="file"
                    id="file-upload"
                    className="file-input"
                    onChange={handleFileSelect}
                    accept={acceptString}
                    ref={inputRef}
                  />
                  <button type="button" className="browse-button" onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}>
                    <span className="browse-icon"><Folder /></span>
                    Browse Files
                  </button>
                </>
              )}
            </div>

            {/* Upload Button */}
            {selectedFile && !uploadSuccess && (
              <button 
                className="upload-action-button" 
                onClick={handleUploadFile} 
                disabled={!canUpload}
              >
                <span className="button-icon"><Upload size={18} /></span>
                {isUploading ? 'Uploading...' : 'Upload File'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="generate-button" 
            onClick={handleGenerateReport} 
            disabled={!canQuery || isGenerating} 
            aria-disabled={!canQuery || isGenerating}
          >
            <span className="button-icon"><Search /></span>
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
          <button className="clear-button" onClick={handleClearAll}>
            Clear All
          </button>
        </div>

        {(isGenerating || generatedReport) && (
          <div className="report-card">
            <div className="report-header">
              <div className="report-title">
                <span className="section-icon"><FileText /></span>
                <h2 className="section-title">Generated Report</h2>
              </div>
              {generatedReport && (
                <div className="report-actions">
                  <button className="icon-button" onClick={handleCopy} disabled={!generatedReport}>
                    <span><Copy size={20}/></span>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button className="icon-button" onClick={handleDownload} disabled={!generatedReport}>
                    <span><ArrowDownToLine size={20} /></span>
                    Download
                  </button>
                </div>
              )}
            </div>
            <div className="report-body">
              {isGenerating ? (
                <div className="loading-container">
                  <div className="loading-header">
                    <div className="loading-brain"><Search /></div>
                    <h3>AI Research Assistant is Working</h3>
                    <p>Please wait while we analyze your document and generate a comprehensive report</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">{Math.round(progress)}%</div>
                  </div>

                  {/* Current Step Display */}
                  {currentStepText && (
                    <div className="current-step">
                      <span className="current-step-text">{currentStepText}</span>
                    </div>
                  )}

                  {/* Dynamic Step Indicators */}
                  <div className="steps-container">
                    {(loadingSteps.length > 0 ? loadingSteps : defaultLoadingSteps).map((step, index) => {
                      const StepIcon = step.icon;
                      const isActive = index === currentStep;
                      const isCompleted = step.completed || index < currentStep;
                      
                      return (
                        <div 
                          key={index} 
                          className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                        >
                          <div className="step-icon">
                            <StepIcon size={20} />
                          </div>
                          <div className="step-content">
                            <div className="step-text">{step.text}</div>
                            {isActive && (
                              <div className="step-loading">
                                <div className="loading-dots">
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {generatedReport}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIResearchAssistant;
