import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CADEditor() {
  const canvasRef = useRef(null);
  const [viewport, setViewport] = useState('3d');
  const [objects, setObjects] = useState([]);
  const [selectedTool, setSelectedTool] = useState('select');

  // Basic canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    
    const gridSize = 20;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw center axes
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width/2, height/2);
    ctx.lineTo(width/2 + 50, height/2);
    ctx.stroke();
    
    ctx.strokeStyle = '#44ff44';
    ctx.beginPath();
    ctx.moveTo(width/2, height/2);
    ctx.lineTo(width/2, height/2 - 50);
    ctx.stroke();
    
    // Draw some sample objects
    ctx.fillStyle = '#4488cc';
    ctx.fillRect(width/2 - 25, height/2 - 25, 50, 50);
    
    ctx.fillStyle = '#cc4488';
    ctx.beginPath();
    ctx.arc(width/2 + 100, height/2, 30, 0, Math.PI * 2);
    ctx.fill();
    
  }, [viewport]);

  const addPrimitive = (type) => {
    const newObject = {
      id: Date.now(),
      type,
      x: Math.random() * 200 + 100,
      y: Math.random() * 200 + 100,
      color: '#4488cc'
    };
    setObjects(prev => [...prev, newObject]);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: '#2d2d30',
      color: '#cccccc',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#1e1e1e',
        padding: '8px 16px',
        borderBottom: '1px solid #444',
        gap: '16px'
      }}>
        <Link to="/projects" style={{
          color: '#0078d4',
          textDecoration: 'none',
          fontSize: '14px'
        }}>
          ← Back to Projects
        </Link>
        
        <h1 style={{ 
          margin: 0, 
          fontSize: '16px',
          color: '#ffffff'
        }}>
          3D CAD Editor
        </h1>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewport('2d')}
            style={{
              padding: '4px 12px',
              background: viewport === '2d' ? '#0078d4' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            2D
          </button>
          <button
            onClick={() => setViewport('3d')}
            style={{
              padding: '4px 12px',
              background: viewport === '3d' ? '#0078d4' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            3D
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#3c3c3c',
        padding: '8px 16px',
        borderBottom: '1px solid #444',
        gap: '8px'
      }}>
        <span style={{ fontSize: '12px', color: '#aaa' }}>Tools:</span>
        
        {['select', 'box', 'sphere', 'cylinder'].map(tool => (
          <button
            key={tool}
            onClick={() => {
              setSelectedTool(tool);
              if (tool !== 'select') {
                addPrimitive(tool);
              }
            }}
            style={{
              padding: '6px 12px',
              background: selectedTool === tool ? '#0078d4' : '#555',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              textTransform: 'capitalize'
            }}
          >
            {tool}
          </button>
        ))}
        
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#aaa' }}>
          Objects: {objects.length} | Mode: {viewport.toUpperCase()}
        </div>
      </div>

      {/* Main workspace */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Sidebar */}
        <div style={{
          width: '200px',
          background: '#1a1a1a',
          borderRight: '1px solid #444',
          padding: '16px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>Properties</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Current Tool:
            </label>
            <div style={{ 
              padding: '4px 8px', 
              background: '#333', 
              borderRadius: '4px',
              fontSize: '12px',
              textTransform: 'capitalize'
            }}>
              {selectedTool}
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Viewport:
            </label>
            <div style={{ 
              padding: '4px 8px', 
              background: '#333', 
              borderRadius: '4px',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}>
              {viewport}
            </div>
          </div>

          <h4 style={{ margin: '16px 0 8px 0', fontSize: '12px' }}>Scene Objects</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {objects.map(obj => (
              <div key={obj.id} style={{
                padding: '4px 8px',
                background: '#333',
                marginBottom: '4px',
                borderRadius: '4px',
                fontSize: '11px'
              }}>
                {obj.type} #{obj.id}
              </div>
            ))}
            {objects.length === 0 && (
              <div style={{ fontSize: '11px', color: '#666' }}>
                No objects in scene
              </div>
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#111'
        }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{
              border: '1px solid #444',
              background: '#1a1a1a',
              cursor: 'crosshair'
            }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#0078d4',
        padding: '4px 16px',
        fontSize: '12px',
        color: '#fff'
      }}>
        <span>Ready | Tool: {selectedTool} | Objects: {objects.length}</span>
        <div style={{ marginLeft: 'auto' }}>
          3D CAD Studio - Simplified Editor
        </div>
      </div>
    </div>
  );
}