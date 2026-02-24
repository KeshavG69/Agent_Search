"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Stage } from 'ngl';
import './AlphaFold.css';
import { proteinData } from '@/utils/ProtienExampleSequence';

const AlphaFold = () => {
  const [selectedProtein, setSelectedProtein] = useState('');
  const [sequence, setSequence] = useState('');
  const [pdbText, setPdbText] = useState(null);
  const [loading, setLoading] = useState(false);

  const [scoreType, setScoreType] = useState('e_value');
  const [scoreSlider, setScoreSlider] = useState(4);
  const [bitScore, setBitScore] = useState(50);
  const [iterations, setIterations] = useState(1);
  /* ... inside component ... */
  const [databases, setDatabases] = useState(["small_bfd"]);

  const handleDatabaseChange = (db) => {
    setDatabases(prev => {
      if (prev.includes(db)) {
        return prev.filter(item => item !== db);
      } else {
        return [...prev, db];
      }
    });
  };

  useEffect(() => {
    if (proteinData?.available_proteins?.length > 0) {
      setSelectedProtein(proteinData.available_proteins[0].name);
      setSequence(proteinData.available_proteins[0].sequence);
    }
  }, []);

  /* Use ref instead of document.getElementById */
  const viewerRef = useRef(null);
  const [selectionInfo, setSelectionInfo] = useState(null);
  const selectedResidueRef = useRef(null); // Track currently selected residue for toggling

  useEffect(() => {
    // initialize stage
    if (!pdbText || !viewerRef.current) return;

    // Reset selection state on new PDB load
    selectedResidueRef.current = null;
    setSelectionInfo(null);

    // Clean the PDB text - handle potential JSON escaping or wrapping quotes
    let cleanPdb = pdbText;
    if (typeof cleanPdb === 'string') {
      if (cleanPdb.startsWith('"') && cleanPdb.endsWith('"')) {
        cleanPdb = cleanPdb.slice(1, -1);
      }
      cleanPdb = cleanPdb.replace(/\\n/g, '\n');
    }

    console.log("Initializing NGL Stage with PDB length:", cleanPdb.length);

    // Clear previous content
    viewerRef.current.innerHTML = '';

    // Create NGL Stage
    const stage = new Stage(viewerRef.current, { backgroundColor: 'black' });

    // Handle resizing
    const handleResize = () => stage.handleResize();
    window.addEventListener('resize', handleResize);

    // Load PDB data
    const blob = new Blob([cleanPdb], { type: 'text/plain' });
    stage.loadFile(blob, { ext: 'pdb' }).then((component) => {
      console.log("PDB Component Loaded", component);

      // Add default representation
      component.addRepresentation('cartoon', {
        colorScheme: 'bfactor',
        quality: 'high',
        aspectRatio: 4, // Make ribbon slightly wider/nicer
      });

      component.autoView();

      // Add Interaction (Picking)
      stage.signals.clicked.removeAll();
      stage.signals.clicked.add((pickingProxy) => {
        // Always remove existing selection first (clean slate or preparation for new)
        const existingSelection = component.reprList.find(r => r.name === 'selection');
        if (existingSelection) {
          component.removeRepresentation(existingSelection);
        }

        if (pickingProxy && (pickingProxy.atom || pickingProxy.bond)) {
          const atom = pickingProxy.atom || pickingProxy.closestBondAtom;
          if (!atom) return;

          const resno = atom.resno;
          const chain = atom.chainname;
          const resname = atom.resname;
          const clickedKey = `${chain}:${resno}`;

          // Toggle Logic: If clicking the same residue, just clear state and return
          if (selectedResidueRef.current === clickedKey) {
            console.log("Toggling off selection for", clickedKey);
            selectedResidueRef.current = null;
            setSelectionInfo(null);
            return;
          }

          // New Selection
          selectedResidueRef.current = clickedKey;
          console.log("Selecting", clickedKey);

          // Update Info text
          setSelectionInfo(
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#76b900', fontWeight: 'bold' }}>Polymer 1</div>
              <div style={{ fontSize: '13px' }}>
                model 1 | <strong>{chain}</strong> | <strong style={{ color: '#76b900' }}>{resname} {resno}</strong>
              </div>
            </div>
          );

          // Add ball+stick for selected residue + neighbors
          component.addRepresentation('ball+stick', {
            name: 'selection',
            sele: `${resno}:${chain} or (${resno - 1}:${chain}) or (${resno + 1}:${chain})`,
            colorScheme: 'element',
            aspectRatio: 2,
            radius: 0.3
          });

        } else {
          // Clicked on empty space -> Deselect
          setSelectionInfo(null);
          selectedResidueRef.current = null;
        }
      });

    }).catch(err => {
      console.error("NGL Load Error:", err);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      stage.dispose();
    };
  }, [pdbText]);

  const downloadPdb = () => {
    if (!pdbText) return;
    let cleanPdb = pdbText;
    if (typeof cleanPdb === 'string') {
      if (cleanPdb.startsWith('"') && cleanPdb.endsWith('"')) {
        cleanPdb = cleanPdb.slice(1, -1);
      }
      cleanPdb = cleanPdb.replace(/\\n/g, '\n');
    }
    const element = document.createElement("a");
    const file = new Blob([cleanPdb], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedProtein.replace(/\s+/g, '_')}_structure.pdb`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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

    // Sanitize sequence: remove all whitespace/newlines
    const cleanSequence = sequence.replace(/[\s\n\r]+/g, '').toUpperCase();

    const payload = {
      sequence: cleanSequence,
      algorithm: "mmseqs2",
      iterations: iterations,
      databases: databases,
      score_type: scoreType,
    };
    if (scoreType === "e_value") {
      payload.score_slider = scoreSlider;
      // payload.e_value = Math.pow(10, -scoreSlider); // Backend uses score_slider directly
    } else {
      payload.score_value = bitScore;
      payload.bit_score = bitScore;
    }
    try {
      const res = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || res.statusText);
      }
      const data = await res.json();
      if (data?.nvidia_response && data.nvidia_response[0]) {
        setPdbText(data.nvidia_response[0]);
      } else {
        setPdbText(null);
      }
    } catch (err) {
      console.error('API error:', err);
      setPdbText(null);
      alert(`Prediction Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="container-fluid px-0">
      <div className="row g-0">
        <div className="col-12 col-lg-5 d-flex flex-column justify-content-center p-4 nvidia-panel" style={{ minHeight: '100vh', borderRight: '1px solid #333' }}>
          <h4 className="mb-4">Protein Structure Prediction</h4>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="exampleSequence" className="form-label">Amino Acid Sequence Examples</label>
              <select className="form-select" id="exampleSequence" value={selectedProtein} onChange={handleProteinChange}>
                {proteinData.available_proteins.map((protein, index) => (
                  <option key={index} value={protein.name}>{protein.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="aminoSequence" className="form-label">Amino Acid Sequence <span className="text-danger">*</span></label>
              <textarea className="form-control" id="aminoSequence" rows="3" placeholder="Paste amino acid sequence here" value={sequence} onChange={(e) => setSequence(e.target.value)}></textarea>
            </div>
            <div className="mb-3">
              <label htmlFor="msaTool" className="form-label">MSA Tool</label>
              <select className="form-select" id="msaTool">
                <option defaultValue="mmseqs2">mmseqs2</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Choose the databases to include for MSA</label>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="uniref90"
                  checked={databases.includes("uniref90")}
                  onChange={() => handleDatabaseChange("uniref90")}
                />
                <label className="form-check-label" htmlFor="uniref90">uniref90</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="small_bfd"
                  checked={databases.includes("small_bfd")}
                  onChange={() => handleDatabaseChange("small_bfd")}
                />
                <label className="form-check-label" htmlFor="small_bfd">small_bfd</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="mgnify"
                  checked={databases.includes("mgnify")}
                  onChange={() => handleDatabaseChange("mgnify")}
                />
                <label className="form-check-label" htmlFor="mgnify">mgnify</label>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Inclusion Threshold</label>
              <ul className="nav nav-pills mb-2" id="inclusionTabs">
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${scoreType === 'e_value' ? 'active' : ''}`}
                    onClick={() => setScoreType('e_value')}
                  >
                    E-value
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${scoreType === 'bit_score' ? 'active' : ''}`}
                    onClick={() => setScoreType('bit_score')}
                  >
                    Bit Score
                  </button>
                </li>
              </ul>
              {scoreType === 'e_value' ? (
                <>
                  <label className="form-label">E value is 10<sup>-n</sup> where n is the slider value</label>
                  <input
                    type="range"
                    className="form-range"
                    min="1"
                    max="10"
                    value={scoreSlider}
                    onChange={e => setScoreSlider(Number(e.target.value))}
                  />
                  <div className="text-end small text-muted">Value: <span>{scoreSlider}</span></div>
                </>
              ) : (
                <>
                  <label className="form-label">Bit Score (1-1000)</label>
                  <input
                    type="range"
                    className="form-range"
                    min="1"
                    max="1000"
                    value={bitScore}
                    onChange={e => setBitScore(Number(e.target.value))}
                  />
                  <div className="text-end small text-muted">Value: <span>{bitScore}</span></div>
                </>
              )}
            </div>
            <div className="mb-3">
              <label htmlFor="iterations" className="form-label">Iterations</label>
              <input
                type="range"
                className="form-range"
                min="1"
                max="3"
                value={iterations}
                onChange={e => setIterations(Number(e.target.value))}
              />
              <div className="text-end small text-muted">Value: <span>{iterations}</span></div>
            </div>
            <div className="mb-3 form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="geometryRefinement"
                defaultChecked
              />
              <label className="form-check-label" htmlFor="geometryRefinement">Perform Geometry Refinement</label>
              <div className="form-text text-muted">Optimize atom positions based on molecule geometry constraints</div>
            </div>
            <div className="d-flex justify-content-between">
              <button type="reset" className="btn btn-outline-secondary" disabled={loading}>Reset</button>
              <button
                type="submit"
                className="btn"
                style={{
                  backgroundColor: '#76b900',
                  color: '#000000',
                  border: 'none',
                  fontWeight: 'bold'
                }}
                disabled={loading}
              >
                {loading ? "Running..." : "Run"}
              </button>
            </div>
            {loading && (
              <div className="text-center my-3">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span className="ms-2 text-muted">Predicting structure, please wait...</span>
              </div>
            )}
          </form>
          <div className="mt-4 small text-muted">
            <strong style={{ color: '#76b900' }}>GOVERNING TERMS:</strong> This trial service is governed by the NVIDIA API Trial Service Terms of Use and the use of this model is governed by the Apache 2.0 License.
          </div>
        </div>
        <div className="col-12 col-lg-7 d-flex flex-column align-items-center justify-content-center viewer-container" style={{ minHeight: '100vh' }}>
          <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            position: 'relative',
          }}>
            <div style={{
              color: '#76b900',
              fontWeight: 'bold',
              fontSize: 22,
              marginBottom: 12,
              marginTop: 20,
              letterSpacing: 1,
              textAlign: 'center'
            }}>
              3D Protein Structure Viewer
            </div>
            <div ref={viewerRef} style={{
              width: '100%',
              height: 'calc(100vh - 80px)',
              minHeight: 400,
              position: 'relative'
            }}>
              {/* Overlay Controls */}
              {pdbText && (
                <>
                  {/* Top Right Tools */}
                  <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 5, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      className="btn"
                      onClick={downloadPdb}
                      style={{
                        color: '#76b900',
                        background: 'transparent',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                      </svg>
                      Download
                    </button>
                  </div>

                  {/* Right Side Legend */}
                  <div style={{
                    position: 'absolute',
                    right: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.8)',
                    padding: '10px',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '12px',
                    height: '320px',
                    alignItems: 'center',
                    zIndex: 5
                  }}>
                    <div style={{
                      width: '24px',
                      height: '100%',
                      background: 'linear-gradient(to top, #7d26cd 0%, #00bbff 50%, #ffff00 75%, #ff9900 100%)',
                      position: 'relative',
                      border: '1px solid #fff'
                    }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>
                      <span>100</span>
                      <span>90</span>
                      <span>70</span>
                      <span>50</span>
                      <span>0</span>
                    </div>
                    <div style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      color: '#fff',
                      fontSize: '16px',
                      letterSpacing: '1px',
                      fontWeight: '500'
                    }}>
                      Prediction Score (pLDDT)
                    </div>
                  </div>

                  {/* Bottom Right Info Box */}
                  <div style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    background: 'rgba(20, 20, 20, 0.9)',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    borderLeft: '4px solid #007bff', // Blue accent matching reference image polymer label
                    color: '#fff',
                    maxWidth: '300px',
                    zIndex: 5,
                    display: selectionInfo ? 'block' : 'none',
                    fontSize: '14px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                  }}>
                    {selectionInfo}
                  </div>
                </>
              )}

              {/* Bottom Right Info Box */}


              {loading && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, width: '100%', height: '100%',
                  background: 'rgba(0,0,0,0.85)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10
                }}>
                  <span className="spinner-border spinner-border-lg" role="status" aria-hidden="true"></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlphaFold;
