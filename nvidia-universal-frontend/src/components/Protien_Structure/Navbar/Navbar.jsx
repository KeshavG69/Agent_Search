import React from 'react';
import './Navbar.css';

export const Navbar = () => {
  return (
    <header className="nvidia-navbar">
      <div className="nvidia-navbar-content">
        <div className="company-logo">
          <a href='https://www.genaiprotos.com/' target='_blank' rel="noopener noreferrer">
            <img src="/GP_White LOGO.png" alt="Company Logo" className="logo-image" />
          </a>
        </div>
        <div className="nvidia-branding">
          <span className="powered-by">Powered by</span>
          <span className="nvidia-text">NVIDIA</span>
        </div>
      </div>
    </header>
  );
};
