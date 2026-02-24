import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Play, Pause, RotateCcw } from 'lucide-react';
import './QuerySection.css';

function QuerySection({ documentId, setDocumentId }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [playingAudioIndex, setPlayingAudioIndex] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to audio events
  useEffect(() => {
    if (audioRef.current) {
      const handleEnded = () => {
        setIsAudioPlaying(false);
        setPlayingAudioIndex(null);
      };

      const handlePause = () => {
        setIsAudioPlaying(false);
      };

      const handlePlay = () => {
        setIsAudioPlaying(true);
      };

      audioRef.current.addEventListener('ended', handleEnded);
      audioRef.current.addEventListener('pause', handlePause);
      audioRef.current.addEventListener('play', handlePlay);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('ended', handleEnded);
          audioRef.current.removeEventListener('pause', handlePause);
          audioRef.current.removeEventListener('play', handlePlay);
        }
      };
    }
  }, [audioRef.current]);

  const playAudio = (audioUrl, messageIndex) => {
    // If same audio is already loaded
    if (playingAudioIndex === messageIndex && audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
        });
      }
      return;
    }

    // Stop previous audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Create new audio
    const audio = new Audio(`http://localhost:8000${audioUrl}`);
    audioRef.current = audio;
    setPlayingAudioIndex(messageIndex);

    audio.play().catch(err => {
      console.error('Error playing audio:', err);
      setIsAudioPlaying(false);
      setPlayingAudioIndex(null);
    });
  };

  const replayAudio = (audioUrl, messageIndex) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Create fresh audio instance
    const audio = new Audio(`http://localhost:8000${audioUrl}`);
    audioRef.current = audio;
    setPlayingAudioIndex(messageIndex);

    audio.play().catch(err => {
      console.error('Error playing audio:', err);
      setIsAudioPlaying(false);
      setPlayingAudioIndex(null);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isStreaming || !documentId) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    const currentQuery = query;
    setQuery('');
    setIsStreaming(true);

    // Add placeholder AI message
    const aiMessage = { role: 'assistant', content: 'Thinking...', audioUrl: null };
    setMessages(prev => [...prev, aiMessage]);

    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          query: currentQuery
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get response');
      }

      const data = await response.json();

      // Update the AI message with the response
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: data.text_answer,
          audioUrl: data.audio_url
        };
        return updated;
      });

      // Auto-play the audio
      if (data.audio_url) {
        const messageIndex = messages.length; // This will be the index of the new AI message
        playAudio(data.audio_url, messageIndex);
      }

    } catch (err) {
      console.error('Error:', err);
      
      // Update message with error
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Error: ${err.message}`,
          audioUrl: null
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="query-section">
      <div className="query-card">
        <div className="query-header">
          <h2 className="query-title">Ask Questions</h2>
          <button 
            className="new-document-button"
            onClick={() => setDocumentId(null)}
          >
            New Document
          </button>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>Ask any question about your document</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">
                  {message.role === 'assistant' ? (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                      {message.audioUrl && (
                        <div className="audio-controls">
                          <button
                            className="audio-control-button"
                            onClick={() => playAudio(message.audioUrl, index)}
                            title={isAudioPlaying && playingAudioIndex === index ? "Pause audio" : "Play audio"}
                          >
                            {isAudioPlaying && playingAudioIndex === index ? (
                              <Pause size={20} />
                            ) : (
                              <Play size={20} />
                            )}
                          </button>
                          <button
                            className="audio-control-button"
                            onClick={() => replayAudio(message.audioUrl, index)}
                            title="Replay audio"
                          >
                            <RotateCcw size={20} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="query-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question here..."
            className="query-input"
            disabled={isStreaming || !documentId}
          />
          <button
            type="submit"
            className="query-submit-button"
            disabled={isStreaming || !query.trim() || !documentId}
          >
            {isStreaming ? (
              <span className="loading-spinner"></span>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default QuerySection;
