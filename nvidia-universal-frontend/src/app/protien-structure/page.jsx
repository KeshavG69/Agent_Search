"use client";

import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'
import './ProtienStructure.css';
import AlphaFold from '@/components/Protien_Structure/AlphaFold/AlphaFold';
import BoltzStructure from '@/components/Protien_Structure/BoltzStructure/BoltzStructure';
import { Navbar } from '@/components/Protien_Structure/Navbar/Navbar';
import FloatingButtons from '@/components/FloatingButton/FloatingButtons';


const ProtienStructure = () => {
  const [activeComponent, setActiveComponent] = useState('regular');

  return (
    <>

      <div>
        <Navbar />
        <div className="container">
          <div className="button-container">
            <button
              onClick={() => setActiveComponent('regular')}
              className={`button ${activeComponent === 'regular' ? 'active' : ''}`}
            >
              Regular Protein Structure
            </button>
            <button
              onClick={() => setActiveComponent('mutated')}
              className={`button ${activeComponent === 'mutated' ? 'active' : ''}`}
            >
              Mutated Protein Structure
            </button>
          </div>
          {activeComponent === 'regular' ? <AlphaFold /> : <BoltzStructure />}
        </div>
      </div>
      <FloatingButtons />
    </>
  );
};

export default ProtienStructure;