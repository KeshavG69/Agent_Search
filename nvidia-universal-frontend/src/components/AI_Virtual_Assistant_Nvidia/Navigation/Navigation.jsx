"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, MessageCircle, Settings, Menu, X } from "lucide-react";
import "./Navigation.css";
import Image from "next/image";
import GenaiLogo from "../../../assets/genai_new_logo.png";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navigation" style={{display: 'flex', justifyContent: 'space-between'}}>
      <div className="nav-container">
        
        <a href='https://www.genaiprotos.com/' target='_blank'>
          <img src="/GP_White LOGO.png" alt="Company Logo" className="logo-image" style={{height: '3.5rem', width: 'auto', objectFit: 'contain'}} />
        </a>

        {/* Nav Links */}
        <div className={`nav-links ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          {/* <Link
            href="/"
            className={`nav-link ${pathname === "/" ? "active" : ""}`}
            onClick={closeMobileMenu}
          >
            <Home size={20} />
            <span>Home</span>
          </Link> */}

          <Link
            href="/ai-virtual-assistant/chat"
            className={`nav-link ${pathname === "/chat" ? "active" : ""}`}
            onClick={closeMobileMenu}
          >
            <MessageCircle size={20} />
            <span>Chat</span>
          </Link>

          <Link
            href="/ai-virtual-assistant"
            className={`nav-link ${pathname === "/admin" ? "active" : ""}`}
            onClick={closeMobileMenu}
          >
            <Settings size={20} />
            <span>Admin</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
     
    </nav>
  );
};

export default Navigation;
