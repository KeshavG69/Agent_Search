"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Typography } from 'antd';
import { RocketOutlined, ThunderboltOutlined, ApiOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons';
import './NvidiaLanding.css';

const { Title, Paragraph } = Typography;

export default function NvidiaLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="nvidia-landing-container">
      <div className="animated-bg"></div>
      <div className="grid-overlay"></div>

      <div className="content-wrapper">
        {/* Header */}
        <header className="landing-header">
          <div className="header-content">
            <div className="company-logo">
              <ThunderboltOutlined className="logo-icon" />
              <span className="logo-text">NVIDIA AI POC</span>
            </div>
            
            <nav className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <button onClick={() => scrollToSection('hero')} className="nav-link">
                Home
              </button>
              <button onClick={() => scrollToSection('features')} className="nav-link">
                Features
              </button>
              <button onClick={() => scrollToSection('models')} className="nav-link">
                Models
              </button>
              <Button className="cta-button" onClick={() => router.push('/poc')}>
                Get Started
              </Button>
            </nav>

            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            </button>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <div className="main-content">
          {/* Hero Section */}
          <section id="hero" className="hero-section">
            <Title className="hero-title">
              Supercharge Your AI with <span className="highlight">NVIDIA</span>
            </Title>
            <Paragraph className="hero-subtitle">
              Harness the power of cutting-edge NVIDIA GPU-accelerated models for lightning-fast inference, 
              unparalleled performance, and seamless integration into your applications.
            </Paragraph>
            <div className="hero-buttons">
              <Button size="large" className="primary-cta" onClick={() => router.push('/poc')}>
                <RocketOutlined /> Start Building
              </Button>
              <Button size="large" className="secondary-cta">
                <ApiOutlined /> View API Docs
              </Button>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="features-section">
            <div className="section-header">
              <Title level={2} className="section-title">Why Choose Our Platform</Title>
              <Paragraph className="section-subtitle">
                Built on NVIDIA's industry-leading infrastructure for maximum performance
              </Paragraph>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <ThunderboltOutlined className="feature-icon" />
                <Title level={3} className="feature-title">Lightning Fast</Title>
                <Paragraph className="feature-description">
                  Powered by NVIDIA GPUs for unprecedented inference speed and real-time processing capabilities.
                </Paragraph>
              </div>

              <div className="feature-card">
                <ApiOutlined className="feature-icon" />
                <Title level={3} className="feature-title">Easy Integration</Title>
                <Paragraph className="feature-description">
                  Simple REST API integration with comprehensive documentation and SDKs for multiple languages.
                </Paragraph>
              </div>

              <div className="feature-card">
                <RocketOutlined className="feature-icon" />
                <Title level={3} className="feature-title">Production Ready</Title>
                <Paragraph className="feature-description">
                  Enterprise-grade infrastructure with 99.9% uptime SLA and dedicated support channels.
                </Paragraph>
              </div>
            </div>
          </section>

          {/* Models Section */}
          <section id="models" className="models-section">
            <div className="section-header">
              <Title level={2} className="section-title">Available Models</Title>
              <Paragraph className="section-subtitle">
                Access state-of-the-art AI models optimized for NVIDIA hardware
              </Paragraph>
            </div>

            <div className="models-grid">
              <div className="model-card">
                <Title level={4} className="model-name">Llama 3.1</Title>
                <div className="model-category">LLM</div>
                <Paragraph className="model-performance">405B parameters</Paragraph>
              </div>

              <div className="model-card">
                <Title level={4} className="model-name">Mistral Large</Title>
                <div className="model-category">LLM</div>
                <Paragraph className="model-performance">Multilingual</Paragraph>
              </div>

              <div className="model-card">
                <Title level={4} className="model-name">Stable Diffusion</Title>
                <div className="model-category">Image Gen</div>
                <Paragraph className="model-performance">XL Turbo</Paragraph>
              </div>

              <div className="model-card">
                <Title level={4} className="model-name">Whisper</Title>
                <div className="model-category">Speech</div>
                <Paragraph className="model-performance">Large V3</Paragraph>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
            <div className="cta-content">
              <Title level={2} className="cta-title">Ready to Get Started?</Title>
              <Paragraph className="cta-subtitle">
                Join thousands of developers building the future with NVIDIA AI
              </Paragraph>
              <div className="cta-buttons">
                <Button size="large" className="primary-cta" onClick={() => router.push('/poc')}>
                  Explore POCs
                </Button>
                <Button size="large" className="secondary-cta">
                  Contact Sales
                </Button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="landing-footer">
            <Paragraph className="footer-text">
              © 2024 NVIDIA AI POC. Powered by NVIDIA Technology.
            </Paragraph>
          </footer>
        </div>
      </div>
    </div>
  );
}