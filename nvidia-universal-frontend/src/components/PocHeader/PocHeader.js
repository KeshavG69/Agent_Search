import React from 'react';
import './PocHeader.css';

const PocHeader = () => {
  return (
    <header className="poc-header">
      <div className="poc-header-content">
        <div className="company-logo">
          <a href='https://www.genaiprotos.com/' target='_blank'>
            <img src="/GP_White LOGO.png" alt="Company Logo" className="logo-image" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default PocHeader;
