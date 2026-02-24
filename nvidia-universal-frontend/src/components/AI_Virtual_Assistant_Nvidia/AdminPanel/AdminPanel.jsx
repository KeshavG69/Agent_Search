"use client"

import React, { useState } from 'react'
import { Settings, Upload, Link2, FileText, AlertCircle, CheckCircle, Database } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './AdminPanel.css'

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('url')
  const [urlInput, setUrlInput] = useState('')
  const [mongoURI, setMongoURI] = useState('')
  const [mongoDatabase, setMongoDatabase] = useState('')
  const [mongoConnectionName, setMongoConnectionName] = useState('')
  const [systemStatus, setSystemStatus] = useState('not-checked')
  const [isUploading, setIsUploading] = useState(false)
  const [lastResponse, setLastResponse] = useState('')
  
  // Generate a unique user ID for admin operations
  const [userId] = useState(() => `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  // Backend URL
  const BACKEND_BASE_URL = 'http://localhost:8000'

  // Flexible URL validation - accepts any valid URL format
  const isValidUrl = (string) => {
    // First, try to create URL object with the string as-is
    try {
      new URL(string)
      return true
    } catch (_) {
      // If it fails, try adding https:// prefix for domain-only URLs
      try {
        new URL(`https://${string}`)
        return true
      } catch (_) {
        // Use regex as fallback for various URL patterns
        const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/
        return urlPattern.test(string)
      }
    }
  }

  // Validate MongoDB URI format
  const isValidMongoURI = (uri) => {
    // Basic MongoDB URI pattern validation
    const mongoURIPattern = /^mongodb(\+srv)?:\/\/.*$/
    return mongoURIPattern.test(uri.trim())
  }

  // Normalize URL - add protocol if missing
  const normalizeUrl = (url) => {
    const trimmedUrl = url.trim()
    
    // If URL already has a protocol, return as-is
    if (/^https?:\/\//i.test(trimmedUrl)) {
      return trimmedUrl
    }
    
    // If URL starts with www. or appears to be a domain, add https://
    if (/^(www\.)|^[\w-]+\.[\w-]{2,}/i.test(trimmedUrl)) {
      return `https://${trimmedUrl}`
    }
    
    // Otherwise, assume it needs https://
    return `https://${trimmedUrl}`
  }

  const handleDataIngestion = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL')
      return
    }

    if (!isValidUrl(urlInput.trim())) {
      toast.error('Please enter a valid URL (e.g., example.com, www.example.com, or https://example.com)')
      return
    }
    
    setIsUploading(true)
    setLastResponse('')
    
    try {
      // Normalize the URL before sending
      const normalizedUrl = normalizeUrl(urlInput.trim())
      console.log('🚀 Sending URL ingestion request:', normalizedUrl)

      const formData = new FormData()
      formData.append('url', normalizedUrl)

      const response = await fetch(`${BACKEND_BASE_URL}/admin/ingest`, {
        method: 'POST',
        body: formData
      })

      const responseData = await response.json()
      console.log('📡 Response:', responseData)

      if (response.ok) {
        setLastResponse(`✅ ${responseData.message}`)
        setUrlInput('')
        toast.success('URL ingestion initiated successfully')
      } else {
        const errorMessage = responseData.detail || `HTTP ${response.status}`
        setLastResponse(`❌ Error: ${errorMessage}`)
        toast.error(`Error: ${errorMessage}`)
      }

    } catch (error) {
      console.error('❌ Ingestion failed:', error)
      const errorMessage = `Network error: ${error.message}`
      setLastResponse(`❌ ${errorMessage}`)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleMongoIngestion = async () => {
    if (!mongoURI.trim() || !mongoDatabase.trim() || !mongoConnectionName.trim()) {
      toast.error('Please fill in all MongoDB connection fields')
      return
    }

    if (!isValidMongoURI(mongoURI.trim())) {
      toast.error('Please enter a valid MongoDB URI (must start with mongodb:// or mongodb+srv://)')
      return
    }
    
    setIsUploading(true)
    setLastResponse('')
    
    try {
      console.log('🚀 Sending MongoDB configuration request:', {
        uri: mongoURI.trim(),
        database: mongoDatabase.trim(),
        connectionName: mongoConnectionName.trim(),
        userId: userId
      })

      const formData = new FormData()
      // Use the correct parameter names that match your backend
      formData.append('uri', mongoURI.trim())
      formData.append('db_name', mongoDatabase.trim())
      formData.append('collection_name', mongoConnectionName.trim())
      formData.append('user_id', userId)

      // Use the existing /admin/ingest endpoint (not /admin/ingest-mongo)
      const response = await fetch(`${BACKEND_BASE_URL}/admin/ingest`, {
        method: 'POST',
        body: formData
      })

      const responseData = await response.json()
      console.log('📡 Response:', responseData)

      if (response.ok) {
        setLastResponse(`✅ ${responseData.message}`)
        setMongoURI('')
        setMongoDatabase('')
        setMongoConnectionName('')
        toast.success('MongoDB configuration saved successfully')
      } else {
        const errorMessage = responseData.detail || `HTTP ${response.status}`
        setLastResponse(`❌ Error: ${errorMessage}`)
        toast.error(`Error: ${errorMessage}`)
      }

    } catch (error) {
      console.error('❌ MongoDB configuration failed:', error)
      const errorMessage = `Network error: ${error.message}`
      setLastResponse(`❌ ${errorMessage}`)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    setLastResponse('')
    
    try {
      console.log('🚀 Sending file upload request:', file.name)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${BACKEND_BASE_URL}/admin/ingest`, {
        method: 'POST',
        body: formData
      })

      const responseData = await response.json()
      console.log('📡 Response:', responseData)

      if (response.ok) {
        setLastResponse(`✅ ${responseData.message}`)
        toast.success(`File "${file.name}" uploaded successfully`)
      } else {
        const errorMessage = responseData.detail || `HTTP ${response.status}`
        setLastResponse(`❌ Error: ${errorMessage}`)
        toast.error(`File upload failed: ${errorMessage}`)
      }

    } catch (error) {
      console.error('❌ File upload failed:', error)
      const errorMessage = `Network error: ${error.message}`
      setLastResponse(`❌ ${errorMessage}`)
      toast.error(`Upload failed: ${errorMessage}`)
    } finally {
      setIsUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const checkSystemStatus = async () => {
    setSystemStatus('checking')
    setLastResponse('')
    
    try {
      console.log('🚀 Checking system status...')

      const response = await fetch(`${BACKEND_BASE_URL}/admin/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const statusData = await response.json()
      console.log('📡 Status response:', statusData)

      if (response.ok) {
        setSystemStatus('healthy')
        setLastResponse(`✅ System Status: ${statusData.status}, Pinecone Index: ${statusData.pinecone_index}`)
        toast.success('System is healthy')
      } else {
        setSystemStatus('error')
        setLastResponse(`❌ Status check failed: ${statusData.detail || 'Unknown error'}`)
        toast.error(`Status check failed: ${statusData.detail || 'Unknown error'}`)
      }

    } catch (error) {
      console.error('❌ Status check failed:', error)
      setSystemStatus('error')
      setLastResponse(`❌ Status check failed: ${error.message}`)
      toast.error(`Status check failed: ${error.message}`)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      if (activeTab === 'url') {
        handleDataIngestion()
      } else if (activeTab === 'mongodb') {
        handleMongoIngestion()
      }
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-title-section">
            <div className="admin-icon">
              <Settings size={24} />
            </div>
            <div className="admin-info">
              <h1>Admin Panel</h1>
              <p>Manage your AI Assistant's knowledge base</p>
            </div>
          </div>
        </div>

        <div className="admin-content">
          <div className="system-status-section">
            <div className="section-header">
              <h2>System Status</h2>
            </div>
            
            <div className="status-card">
              <div className="status-info">
                <div className="status-indicator">
                  {systemStatus === 'not-checked' && <AlertCircle size={20} className="status-icon warning" />}
                  {systemStatus === 'checking' && <div className="loading-spinner"></div>}
                  {systemStatus === 'healthy' && <CheckCircle size={20} className="status-icon success" />}
                  {systemStatus === 'error' && <AlertCircle size={20} className="status-icon error" />}
                </div>
                <div className="status-text">
                  {systemStatus === 'not-checked' && 'Status not checked yet'}
                  {systemStatus === 'checking' && 'Checking system status...'}
                  {systemStatus === 'healthy' && 'System is healthy'}
                  {systemStatus === 'error' && 'System error detected'}
                </div>
              </div>
              <button 
                onClick={checkSystemStatus}
                className="check-status-btn"
                disabled={systemStatus === 'checking'}
              >
                {systemStatus === 'checking' ? 'Checking...' : 'Check Status'}
              </button>
            </div>
          </div>

          <div className="data-ingestion-section">
            <div className="section-header">
              <h2>Data Ingestion</h2>
            </div>

            <div className="ingestion-tabs">
              <button 
                className={`tab-button ${activeTab === 'url' ? 'active' : ''}`}
                onClick={() => setActiveTab('url')}
              >
                <Link2 size={16} />
                URL
              </button>
              <button 
                className={`tab-button ${activeTab === 'file' ? 'active' : ''}`}
                onClick={() => setActiveTab('file')}
              >
                <Upload size={16} />
                File Upload
              </button>
              <button 
                className={`tab-button ${activeTab === 'mongodb' ? 'active' : ''}`}
                onClick={() => setActiveTab('mongodb')}
              >
                <Database size={16} />
                MongoDB
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'url' && (
                <div className="url-ingestion">
                  <div className="form-group">
                    <label htmlFor="source-url">Website URL</label>
                    <textarea
                      id="source-url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter any URL format (e.g., example.com, www.example.com, https://example.com)..."
                      className="source-input"
                      rows="3"
                      disabled={isUploading}
                    />
                    <div className="input-help">
                      Accepts any URL format - with or without protocol. Press Ctrl+Enter to submit.
                    </div>
                  </div>

                  <button 
                    onClick={handleDataIngestion}
                    className="ingest-btn"
                    disabled={!urlInput.trim() || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="loading-spinner small"></div>
                        Ingesting URL...
                      </>
                    ) : (
                      <>
                        <Link2 size={16} />
                        Ingest URL
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'file' && (
                <div className="file-ingestion">
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="file-upload"
                      className="file-input"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt,.md"
                      disabled={isUploading}
                    />
                    <label htmlFor="file-upload" className={`file-upload-label ${isUploading ? 'disabled' : ''}`}>
                      {isUploading ? (
                        <>
                          <div className="loading-spinner"></div>
                          <div className="upload-text">
                            <p>Uploading file...</p>
                            <p className="upload-subtitle">Please wait</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload size={32} />
                          <div className="upload-text">
                            <p>Click to upload files</p>
                            <p className="upload-subtitle">Supports PDF, Word, Text, and Markdown files</p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'mongodb' && (
                <div className="mongodb-ingestion">
                  <div className="form-group">
                    <label htmlFor="mongo-uri">MongoDB URI</label>
                    <textarea
                      id="mongo-uri"
                      value={mongoURI}
                      onChange={(e) => setMongoURI(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="mongodb://username:password@host:port/database or mongodb+srv://username:password@cluster.mongodb.net/database"
                      className="source-input"
                      rows="2"
                      disabled={isUploading}
                    />
                    <div className="input-help">
                      Enter MongoDB connection URI. Supports both standard and SRV format.
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="mongo-database">Database Name</label>
                    <input
                      type="text"
                      id="mongo-database"
                      value={mongoDatabase}
                      onChange={(e) => setMongoDatabase(e.target.value)}
                      placeholder="Enter database name (e.g., myapp, production)"
                      className="source-input"
                      disabled={isUploading}
                    />
                    <div className="input-help">
                      Specify the MongoDB database name to connect to.
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="mongo-connection-name">Collection Name</label>
                    <input
                      type="text"
                      id="mongo-connection-name"
                      value={mongoConnectionName}
                      onChange={(e) => setMongoConnectionName(e.target.value)}
                      placeholder="Enter collection name (e.g., users, products, sessions)"
                      className="source-input"
                      disabled={isUploading}
                    />
                    <div className="input-help">
                      Specify the MongoDB collection name to query.
                    </div>
                  </div>

                  <button 
                    onClick={handleMongoIngestion}
                    className="ingest-btn"
                    disabled={!mongoURI.trim() || !mongoDatabase.trim() || !mongoConnectionName.trim() || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="loading-spinner small"></div>
                        Configuring MongoDB...
                      </>
                    ) : (
                      <>
                        <Database size={16} />
                        Configure MongoDB
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Response Display */}
            {lastResponse && (
              <div className="response-section">
                <div className="section-header">
                  <h3>Last Response</h3>
                </div>
                <div className="response-card">
                  <pre className="response-text">{lastResponse}</pre>
                </div>
              </div>
            )}
          </div>

          <div className="instructions-section">
            <h3>Instructions</h3>
            <ul className="instructions-list">
              <li><strong>URL Ingestion:</strong> Enter any URL format to scrape and ingest web content into the knowledge base</li>
              <li><strong>File Upload:</strong> Upload documents (PDF, Word, Text, Markdown) for processing and ingestion</li>
              <li><strong>MongoDB:</strong> Configure MongoDB connection with URI, database name, and collection name for data querying</li>
              <li><strong>System Status:</strong> Check Pinecone index connection and overall system health</li>
              <li><strong>Processing:</strong> All ingested data becomes available to the AI assistant for enhanced responses</li>
              <li><strong>Shortcuts:</strong> Use Ctrl+Enter to quickly submit forms in any tab</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default AdminPanel
