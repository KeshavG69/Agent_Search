"use client"
import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import './ChatInterface.css'

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: "Hello! I'm your **AI Virtual Assistant**. How can I assist you with your enterprise customer support needs today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const messagesEndRef = useRef(null)

  // Backend URL
  const BACKEND_BASE_URL = 'http://localhost:8000'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const tryParseJson = (jsonString) => {
    try {
      return JSON.parse(jsonString)
    } catch (error) {
      return null
    }
  }

  const findCompleteJsonObjects = (buffer) => {
    const results = []
    let braceCount = 0
    let start = -1
    let inString = false
    let escapeNext = false
    
    for (let i = 0; i < buffer.length; i++) {
      const char = buffer[i]
      
      if (escapeNext) {
        escapeNext = false
        continue
      }
      
      if (char === '\\' && inString) {
        escapeNext = true
        continue
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString
        continue
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            start = i
          }
          braceCount++
        } else if (char === '}') {
          braceCount--
          if (braceCount === 0 && start !== -1) {
            const jsonString = buffer.substring(start, i + 1)
            const parsed = tryParseJson(jsonString)
            if (parsed) {
              results.push({
                json: parsed,
                endIndex: i + 1
              })
            }
            start = -1
          }
        }
      }
    }
    
    return results
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputValue
    setInputValue('')
    setIsTyping(true)

    // Prepare AI message
    const aiMessageId = Date.now() + 1
    let fullResponse = ''

    // Add initial empty AI message
    const initialAiMessage = {
      id: aiMessageId,
      type: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, initialAiMessage])

    try {
      console.log('🚀 Sending request to:', `${BACKEND_BASE_URL}/chat`)

      const response = await fetch(`${BACKEND_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          user_id: userId
        })
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }))
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body received')
      }

      // Read streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('✅ Stream completed')
            setIsTyping(false)
            break
          }

          // Decode chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // Find and process complete JSON objects
          const jsonObjects = findCompleteJsonObjects(buffer)
          
          // Remove processed JSON objects from buffer
          let lastProcessedIndex = 0
          jsonObjects.forEach(({ json, endIndex }) => {
            lastProcessedIndex = Math.max(lastProcessedIndex, endIndex)
            
            console.log('📦 Processed JSON:', json.event, 'Content:', json.content)

            // Only process events that contain actual content
            if (json.event === 'RunResponseContent' && json.content) {
              fullResponse += json.content
              
              // Update the AI message with accumulated content
              setMessages(prev => {
                return prev.map(msg => {
                  if (msg.id === aiMessageId) {
                    return {
                      ...msg,
                      text: fullResponse,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  }
                  return msg
                })
              })
            }
            // Handle run completion
            else if (json.event === 'RunCompleted') {
              console.log('✅ Run completed')
              setIsTyping(false)
              
              // If RunCompleted has content, use it as final response
              if (json.content && json.content.trim() && !fullResponse) {
                setMessages(prev => {
                  return prev.map(msg => {
                    if (msg.id === aiMessageId) {
                      return {
                        ...msg,
                        text: json.content,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    }
                    return msg
                  })
                })
              }
            }
            // Handle errors
            else if (json.event === 'RunError') {
              console.error('❌ Run error:', json.content)
              
              setMessages(prev => {
                return prev.map(msg => {
                  if (msg.id === aiMessageId) {
                    return {
                      ...msg,
                      text: `Sorry, I encountered an error: ${json.content}. Please try again.`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  }
                  return msg
                })
              })
              
              setIsTyping(false)
            }
            // Handle run started
            else if (json.event === 'RunStarted') {
              console.log('🚀 Run started')
              setIsTyping(true)
            }
          })

          // Keep unprocessed part of buffer
          if (lastProcessedIndex > 0) {
            buffer = buffer.substring(lastProcessedIndex)
          }
        }

        // Handle any remaining complete JSON in buffer
        const finalJsonObjects = findCompleteJsonObjects(buffer)
        finalJsonObjects.forEach(({ json }) => {
          if (json.event === 'RunResponseContent' && json.content) {
            fullResponse += json.content
            
            setMessages(prev => {
              return prev.map(msg => {
                if (msg.id === aiMessageId) {
                  return {
                    ...msg,
                    text: fullResponse,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                }
                return msg
              })
            })
          }
        })

      } catch (streamError) {
        console.error('❌ Stream processing error:', streamError)
        throw streamError
      } finally {
        reader.releaseLock()
      }

      // Ensure we have some response
      if (!fullResponse.trim()) {
        setMessages(prev => {
          return prev.map(msg => {
            if (msg.id === aiMessageId) {
              return {
                ...msg,
                text: "I apologize, but I didn't receive a proper response. Please try asking your question again.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            }
            return msg
          })
        })
      }

    } catch (error) {
      console.error('❌ Chat request failed:', error)
      setIsTyping(false)
      
      // Show error message
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === aiMessageId) {
            return {
              ...msg,
              text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          }
          return msg
        })
      })
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Custom ReactMarkdown components for better styling
  const markdownComponents = {
    // Code blocks
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '')
      return !inline ? (
        <pre className="code-block">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="inline-code" {...props}>
          {children}
        </code>
      )
    },
    // Paragraphs with better spacing
    p: ({ children }) => <p className="markdown-paragraph">{children}</p>,
    // Lists with better styling
    ul: ({ children }) => <ul className="markdown-list">{children}</ul>,
    ol: ({ children }) => <ol className="markdown-ordered-list">{children}</ol>,
    li: ({ children }) => <li className="markdown-list-item">{children}</li>,
    // Headers with better styling
    h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
    h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
    // Blockquotes
    blockquote: ({ children }) => <blockquote className="markdown-blockquote">{children}</blockquote>,
    // Tables
    table: ({ children }) => <table className="markdown-table">{children}</table>,
    // Links
    a: ({ href, children }) => (
      <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="chat-title-section">
          <div className="chat-icon">
            <Bot size={24} />
          </div>
          <div className="chat-info">
            <h1>AI Virtual Assistant</h1>
            <p>Enterprise Customer Support</p>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'ai' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className="message-content">
              <div className="message-bubble">
                {message.type === 'ai' ? (
                  <div className="markdown-content">
                    <ReactMarkdown 
                      components={markdownComponents}
                    >
                      {message.text || (isTyping ? '*Thinking...*' : '')}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="user-message-text">
                    {message.text}
                  </div>
                )}
              </div>
              <div className="message-timestamp">
                {message.timestamp}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message ai">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="message-bubble typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="chat-input"
            rows="1"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            className="send-button"
            disabled={!inputValue.trim() || isTyping}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
