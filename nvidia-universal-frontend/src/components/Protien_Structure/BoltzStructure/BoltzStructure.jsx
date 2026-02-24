"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Stage } from 'ngl';
import { proteinData } from '@/utils/ProtienExampleSequence';

const PDBViewer = ({ pdb, label }) => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    if (!pdb || !containerRef.current) return;

    // Cleanup previous stage if exists
    if (stageRef.current) {
      stageRef.current.dispose();
      stageRef.current = null;
    }
    containerRef.current.innerHTML = '';

    const stage = new Stage(containerRef.current, { backgroundColor: 'black' });
    stageRef.current = stage;

    const blob = new Blob([pdb], { type: 'text/plain' });
    stage.loadFile(blob, { ext: 'pdb' }).then((component) => {
      component.addRepresentation('cartoon', {
        colorScheme: 'bfactor',
        quality: 'high'
      });
      component.autoView();
    });

    const handleResize = () => stage.handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (stageRef.current) {
        stageRef.current.dispose();
        stageRef.current = null;
      }
    };
  }, [pdb]);

  return (
    <div className="viewer-wrapper" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '600px',
      border: '1px solid #333',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: 'black'
    }}>
      <div style={{ padding: '10px', backgroundColor: '#111', color: '#76b900', fontWeight: 'bold', borderBottom: '1px solid #333' }}>
        {label}
      </div>
      <div ref={containerRef} style={{ flex: 1, width: '100%', minHeight: '550px', position: 'relative' }}>
        {!pdb && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#555' }}>
            No structure loaded
          </div>
        )}
      </div>
    </div>
  );
};

const BoltzStructure = () => {
  const [selectedProtein, setSelectedProtein] = useState('');
  const [sequence, setSequence] = useState('');
  const [wildSeq, setWildSeq] = useState('');
  const [mutantSeq, setMutantSeq] = useState('');
  const [loading, setLoading] = useState(false);
  const [wildPdb, setWildPdb] = useState('');
  const [mutantPdb, setMutantPdb] = useState('');
  const [mutationInfo, setMutationInfo] = useState('');

  useEffect(() => {
    if (proteinData?.available_proteins?.length > 0) {
      setSelectedProtein(proteinData.available_proteins[0].name);
      setSequence(proteinData.available_proteins[0].sequence);
    }
  }, []);

  const handleProteinChange = (e) => {
    const name = e.target.value;
    setSelectedProtein(name);
    const selected = proteinData.available_proteins.find((item) => item.name === name);
    if (selected) {
      setSequence(selected.sequence);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setWildPdb('');
    setMutantPdb('');
    setMutationInfo('');
    const formData = new FormData();
    formData.append('wild_seq', wildSeq);
    formData.append('mutant_seq', mutantSeq);

    try {
      // Assuming localhost:8000 is the correct backend endpoint
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setMutationInfo(data.mutation);

      setWildPdb(data.wild?.result?.pdb || '');
      setMutantPdb(data.mutant?.result?.pdb || '');
    } catch (err) {
      setMutationInfo('Error: Could not fetch prediction.');
      setWildPdb('');
      setMutantPdb('');
    }
    setLoading(false);
  };

  return (
    <div className="boltz-structure d-flex flex-column" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <form onSubmit={handleSubmit} className="container p-4 nvidia-panel mb-4" style={{ maxWidth: 1200, marginTop: '20px', borderRadius: '8px' }}>
        <h4 className="mb-4">Boltz-2 Protein Structure Prediction</h4>
        <div className="row mb-3">
          <div className="col-12 mb-3">
            <label htmlFor="wildSeq" className="form-label">Wild-Type Sequence</label>
            <textarea
              className="form-control"
              id="wildSeq"
              rows={2}
              placeholder="Paste wild-type amino acid sequence here"
              value={wildSeq}
              onChange={e => setWildSeq(e.target.value)}
              required
            />
          </div>
          <div className="col-12">
            <label htmlFor="mutantSeq" className="form-label">Mutant Sequence (optional)</label>
            <textarea
              className="form-control"
              id="mutantSeq"
              rows={2}
              placeholder="Paste mutant amino acid sequence here (leave blank for auto-mutation)"
              value={mutantSeq}
              onChange={e => setMutantSeq(e.target.value)}
            />
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button
            type="submit"
            className="btn"
            style={{
              backgroundColor: '#76b900',
              color: '#000000',
              border: 'none',
              fontWeight: 'bold',
              padding: '10px 30px'
            }}
            disabled={loading || !wildSeq}
          >
            {loading ? "Predicting..." : "Run Prediction"}
          </button>
          {mutationInfo && <span className="text-muted ms-3">{mutationInfo}</span>}
        </div>
      </form>
      <div className="container mb-5" style={{ maxWidth: 1200 }}>
        <div className="row g-4">
          <div className="col-md-6">
            <PDBViewer pdb={wildPdb} label="Wild-Type Structure" />
          </div>
          <div className="col-md-6">
            <PDBViewer pdb={mutantPdb} label="Mutant Structure" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoltzStructure;
