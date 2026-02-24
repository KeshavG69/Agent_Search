"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, ImageIcon, AlertTriangle, Shield } from 'lucide-react';
import './FileUpload.css';

const FileUpload = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState('preview');
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const handleFileSelect = async (files) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true);
      setError(null);
      
      // Create local URL for preview
      const localUrl = URL.createObjectURL(file);
      
      setTimeout(() => {
        setUploadedImage({
          url: localUrl,
          name: file.name,
          size: file.size,
          file: file
        });
        setIsUploading(false);
        
        // Send to detection API
        detectDeepfake(file);
      }, 1000);
    }
  };

  const detectDeepfake = async (file) => {
    setIsDetecting(true);
    setDetectionResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8000/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setDetectionResult(result);
    } catch (err) {
      setError(`Detection failed: ${err.message}`);
      console.error('Detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  const drawBoundingBoxes = () => {
    if (!detectionResult || !imgRef.current || !canvasRef.current) return;

    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match image display size
    canvas.width = img.offsetWidth;
    canvas.height = img.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scaling factors
    const scaleX = img.offsetWidth / img.naturalWidth;
    const scaleY = img.offsetHeight / img.naturalHeight;

    // Draw bounding boxes
    detectionResult.data?.forEach((detection) => {
      detection.bounding_boxes?.forEach((bbox, bboxIdx) => {
        if (bbox.vertices && bbox.vertices.length >= 2) {
          const x1 = bbox.vertices[0].x * scaleX;
          const y1 = bbox.vertices[0].y * scaleY;
          const x2 = bbox.vertices[1].x * scaleX;
          const y2 = bbox.vertices[1].y * scaleY;

          const width = x2 - x1;
          const height = y2 - y1;

          // Determine color based on deepfake confidence
          const isDeepfake = bbox.is_deepfake > 0.5;
          const color = isDeepfake ? '#ef4444' : '#22c55e';
          
          // Draw bounding box
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x1, y1, width, height);

          // Draw confidence label
          const confidence = (bbox.bbox_confidence * 100).toFixed(1);
          const deepfakeConf = (bbox.is_deepfake * 100).toFixed(1);
          const label = `Box ${bboxIdx + 1}: ${confidence}% | DF: ${deepfakeConf}%`;
          
          // Measure text width for background
          const textMetrics = ctx.measureText(label);
          const textWidth = textMetrics.width + 10;
          
          ctx.fillStyle = color;
          ctx.fillRect(x1, y1 - 25, textWidth, 25);
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.fillText(label, x1 + 5, y1 - 8);
        }
      });
    });
  };

  // Redraw bounding boxes when image loads or detection result changes
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && detectionResult) {
      drawBoundingBoxes();
    }
  }, [detectionResult]);

  const handleImageLoad = () => {
    if (detectionResult) {
      drawBoundingBoxes();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileSelect(files);
  };

  const removeImage = () => {
    if (uploadedImage?.url) {
      URL.revokeObjectURL(uploadedImage.url);
    }
    setUploadedImage(null);
    setDetectionResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDetectionSummary = () => {
    if (!detectionResult?.data) return null;
    
    const totalBoxes = detectionResult.data.reduce((sum, detection) => 
      sum + (detection.bounding_boxes?.length || 0), 0
    );
    
    const deepfakeBoxes = detectionResult.data.reduce((sum, detection) => 
      sum + (detection.bounding_boxes?.filter(bbox => bbox.is_deepfake > 0.5).length || 0), 0
    );

    return { totalBoxes, deepfakeBoxes };
  };

  const summary = getDetectionSummary();

  return (
    <div className="file-upload-container">
      <div className="upload-section">
        <div className="upload-header">
          <h1 className="upload-title">Deepfake Detector</h1>
          <p className="upload-subtitle">Upload images to detect potential deepfakes</p>
        </div>
        
        {uploadedImage && (
          <div className="uploaded-image-container">
            <div className="image-preview-wrapper">
              <img 
                src={uploadedImage.url} 
                alt={uploadedImage.name}
                className="uploaded-image"
              />
              <button 
                onClick={removeImage}
                className="remove-button"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </div>
            <div className="image-details">
              <p className="image-name">{uploadedImage.name}</p>
              <p className="image-size">{formatFileSize(uploadedImage.size)}</p>
              
              {/* Status indicators */}
              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                {isDetecting && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4285f4' }}>
                    <div className="button-spinner"></div>
                    <span>Analyzing image...</span>
                  </div>
                )}
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}
                {detectionResult && !isDetecting && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e' }}>
                    <Shield size={16} />
                    <span>Analysis complete</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div 
          className={`dropzone ${isDragOver ? 'drag-over' : ''} ${uploadedImage ? 'has-image' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="file-input"
          />
          
          <div className="dropzone-content">
            {isUploading ? (
              <div className="upload-loading">
                <div className="upload-spinner"></div>
                <p className="upload-text">Uploading...</p>
              </div>
            ) : (
              <div className="upload-prompt">
                <div className="upload-icon">
                  <Upload size={48} />
                </div>
                <p className="upload-text">
                  Drag & drop your image here, or{' '}
                  <button 
                    type="button" 
                    onClick={handleButtonClick}
                    className="browse-link"
                  >
                    browse
                  </button>
                </p>
                <p className="upload-hint">Supports: JPG, PNG up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleButtonClick}
          disabled={isUploading || isDetecting}
          className={`upload-button ${uploadedImage && !isDetecting ? 'success' : ''}`}
        >
          {isDetecting ? (
            <>
              <div className="button-spinner"></div>
              <span>Analyzing...</span>
            </>
          ) : uploadedImage ? (
            <>
              <Check size={20} />
              <span>Image Uploaded</span>
            </>
          ) : isUploading ? (
            <>
              <div className="button-spinner"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={20} />
              <span>Upload Image</span>
            </>
          )}
        </button>

        {/* Detection Summary */}
        {summary && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px', 
            marginBottom: '24px' 
          }}>
            <div style={{ 
              background: '#dbeafe', 
              padding: '16px', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>
                {summary.totalBoxes}
              </div>
              <div style={{ fontSize: '14px', color: '#1e40af' }}>Objects Detected</div>
            </div>
            <div style={{ 
              background: summary.deepfakeBoxes > 0 ? '#fee2e2' : '#dcfce7', 
              padding: '16px', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: summary.deepfakeBoxes > 0 ? '#dc2626' : '#16a34a' 
              }}>
                {summary.deepfakeBoxes}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: summary.deepfakeBoxes > 0 ? '#991b1b' : '#15803d' 
              }}>
                Potential Deepfakes
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="preview-section">
        <h2 className="section-title">Preview & Results</h2>
        
        <div className="preview-tabs">
          <button 
            className={`tab-button ${previewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setPreviewMode('preview')}
          >
            Preview
          </button>
          <button 
            className={`tab-button ${previewMode === 'json' ? 'active' : ''}`}
            onClick={() => setPreviewMode('json')}
          >
            JSON Response
          </button>
        </div>
        
        {uploadedImage ? (
          <div className="preview-container">
            {previewMode === 'preview' ? (
              <div className="preview-image-container">
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img 
                    ref={imgRef}
                    src={uploadedImage.url} 
                    alt="Preview"
                    className="preview-image"
                    onLoad={handleImageLoad}
                  />
                  <canvas
                    ref={canvasRef}
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      pointerEvents: 'none',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="json-display">
                <pre className="json-code">
                  {detectionResult ? JSON.stringify(detectionResult, null, 2) : 'No detection results yet...'}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="preview-placeholder">
            <ImageIcon size={64} className="placeholder-icon" />
            <p className="placeholder-text">No image selected</p>
            <p className="placeholder-hint">Upload an image to see detection results</p>
          </div>
        )}

        <div className="bounding-boxes-section">
          <h3 className="section-title">Detection Details</h3>
          <div className="bounding-boxes-content">
            {detectionResult?.data ? (
              <div>
                {detectionResult.data.map((detection, idx) => (
                  <div key={idx} style={{ marginBottom: '16px' }}>
                    <p className="bounding-boxes-text">
                      Detection {idx + 1}: {detection.status}
                    </p>
                    {detection.bounding_boxes?.length > 0 ? (
                      detection.bounding_boxes.map((bbox, bboxIdx) => (
                        <div key={bboxIdx} style={{ 
                          marginLeft: '16px', 
                          marginTop: '8px',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          <div>• Box {bboxIdx + 1}: {(bbox.bbox_confidence * 100).toFixed(1)}% confidence</div>
                          <div style={{ 
                            color: bbox.is_deepfake > 0.5 ? '#ef4444' : '#22c55e',
                            fontWeight: '500'
                          }}>
                            &nbsp;&nbsp;Deepfake probability: {(bbox.is_deepfake * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="bounding-boxes-hint">No objects detected in this image</p>
                    )}
                  </div>
                ))}
              </div>
            ) : isDetecting ? (
              <div>
                <p className="bounding-boxes-text">Analyzing image...</p>
                <p className="bounding-boxes-hint">Please wait while we process your image</p>
              </div>
            ) : (
              <div>
                <p className="bounding-boxes-text">No detection results</p>
                <p className="bounding-boxes-hint">Upload an image to see detection results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;