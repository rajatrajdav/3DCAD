const PropertiesPanel = ({ 
  viewport, 
  currentLayer, 
  setCurrentLayer, 
  layers, 
  lineColor, 
  setLineColor, 
  lineWeight, 
  setLineWeight, 
  entities2D, 
  selectedIds, 
  zoom, 
  activeTool, 
  setActiveTool, 
  entities3D, 
  setEntities3D, 
  nextId, 
  logCommand 
}) => {
  const styles = {
    rightPanel: { 
      width: 240, 
      background: "#101826", 
      borderLeft: "1px solid #1f2d53", 
      display: "flex", 
      flexDirection: "column", 
      overflow: "hidden", 
      flexShrink: 0 
    },
    panelHeader: { 
      padding: "8px 12px", 
      fontSize: 11, 
      fontWeight: 600, 
      color: "#8ec7ff", 
      background: "#101822", 
      borderBottom: "1px solid #253356" 
    },
    panelContent: { 
      padding: 10, 
      overflow: "auto", 
      flex: 1 
    },
    propertyGroup: { 
      marginBottom: 10 
    },
    propertyLabel: { 
      display: "block", 
      color: "#4fc3f7", 
      marginBottom: 3, 
      fontSize: 10 
    },
    select: { 
      width: "100%", 
      background: "#1a2035", 
      color: "#a0aec0", 
      border: "1px solid #2a3248", 
      borderRadius: 3, 
      padding: "4px",
      fontSize: "10px"
    },
    colorInput: { 
      width: "100%", 
      height: 28, 
      border: "1px solid #2a3248", 
      borderRadius: 3, 
      background: "transparent" 
    },
    rangeInput: { 
      width: "100%" 
    },
    rangeValue: { 
      fontSize: 10, 
      marginTop: 3, 
      color: "#9bb7d5" 
    },
    statRow: { 
      display: "flex", 
      justifyContent: "space-between", 
      marginBottom: 3 
    },
    statLabel: { 
      fontSize: 10, 
      color: "#8aa" 
    },
    statValue: { 
      color: "#4fc3f7" 
    },
    button: { 
      width: "100%", 
      padding: "6px", 
      borderRadius: 3, 
      border: "1px solid #2a3248", 
      background: "#141d2e", 
      color: "#9ccfff", 
      cursor: "pointer",
      fontSize: "10px",
      marginBottom: "6px"
    },
    transformButton: (active) => ({ 
      flex: 1, 
      padding: "4px", 
      borderRadius: 3, 
      border: active ? "1px solid #4fc3f7" : "1px solid #2a3248", 
      background: active ? "#1a2545" : "transparent", 
      color: active ? "#4fc3f7" : "#8090aa", 
      cursor: "pointer",
      fontSize: "9px"
    }),
    buttonGroup: { 
      display: "flex", 
      gap: 3 
    }
  };

  return (
    <div style={styles.rightPanel}>
      <div style={styles.panelHeader}>Properties</div>
      <div style={styles.panelContent}>
        {viewport === "2d" ? (
          <>
            <div style={styles.propertyGroup}>
              <div style={styles.propertyLabel}>Layer</div>
              <select 
                value={currentLayer} 
                onChange={e => setCurrentLayer(e.target.value)} 
                style={styles.select}
              >
                {layers.map(layer => (
                  <option key={layer.id} value={layer.name}>{layer.name}</option>
                ))}
              </select>
            </div>
            
            <div style={styles.propertyGroup}>
              <label style={styles.propertyLabel}>Line Color</label>
              <input 
                type="color" 
                value={lineColor} 
                onChange={e => setLineColor(e.target.value)} 
                style={styles.colorInput} 
              />
            </div>
            
            <div style={styles.propertyGroup}>
              <div style={styles.propertyLabel}>Line Weight</div>
              <input 
                type="range" 
                min={0.5} 
                max={6} 
                step={0.5} 
                value={lineWeight} 
                onChange={e => setLineWeight(+e.target.value)} 
                style={styles.rangeInput} 
              />
              <div style={styles.rangeValue}>{lineWeight}px</div>
            </div>
            
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #1e2d4a" }}>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Entities</span>
                <span style={styles.statValue}>{entities2D.length}</span>
              </div>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Selection</span>
                <span style={styles.statValue}>{selectedIds.length}</span>
              </div>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Zoom</span>
                <span style={styles.statValue}>{(zoom * 100).toFixed(0)}%</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={styles.propertyGroup}>
              <div style={styles.propertyLabel}>3D Transform</div>
              <div style={styles.buttonGroup}>
                {['move', 'rotate', 'scale'].map(mode => (
                  <button 
                    key={mode} 
                    onClick={() => setActiveTool(mode)} 
                    style={styles.transformButton(activeTool === mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={styles.propertyGroup}>
              <button 
                onClick={() => {
                  const next = [...entities3D, { 
                    id: nextId(), 
                    type: 'box', 
                    position: { x: 0, y: 0.5, z: 0 }, 
                    rotation: { x: 0, y: 0, z: 0 }, 
                    scale: { x: 1, y: 1, z: 1 }, 
                    color: '#4fc3f7' 
                  }];
                  setEntities3D(next); 
                  logCommand('Added 3D box');
                }} 
                style={styles.button}
              >
                Add 3D Box
              </button>
            </div>
            
            <div style={styles.propertyGroup}>
              <button 
                onClick={() => {
                  const next = [...entities3D, { 
                    id: nextId(), 
                    type: 'sphere', 
                    position: { x: 0, y: 0.75, z: 0 }, 
                    rotation: { x: 0, y: 0, z: 0 }, 
                    scale: { x: 1, y: 1, z: 1 }, 
                    color: '#ffcc66', 
                    radius: 0.75 
                  }];
                  setEntities3D(next); 
                  logCommand('Added 3D sphere');
                }} 
                style={styles.button}
              >
                Add 3D Sphere
              </button>
            </div>
            
            <div style={styles.propertyGroup}>
              <button 
                onClick={() => {
                  const next = [...entities3D, { 
                    id: nextId(), 
                    type: 'cylinder', 
                    position: { x: 0, y: 0.5, z: 0 }, 
                    rotation: { x: 0, y: 0, z: 0 }, 
                    scale: { x: 1, y: 1, z: 1 }, 
                    color: '#ff6b6b', 
                    radius: 0.5,
                    height: 1
                  }];
                  setEntities3D(next); 
                  logCommand('Added 3D cylinder');
                }} 
                style={styles.button}
              >
                Add 3D Cylinder
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;