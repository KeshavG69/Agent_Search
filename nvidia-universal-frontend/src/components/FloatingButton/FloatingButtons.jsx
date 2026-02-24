"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Home, RefreshCw } from "lucide-react";
import "./FloatingButtons.css";

const FloatingButtons = () => {
  const router = useRouter();

  return (
    <div className="floating-buttons">
      <button className="float-btn" onClick={() => router.push("/")}>
        <Home size={16} />
        Go to Home
      </button>
      <button className="float-btn" onClick={() => router.push("/poc")}>
        <RefreshCw size={16} />
        Update POC
      </button>
    </div>
  );
};

export default FloatingButtons;
