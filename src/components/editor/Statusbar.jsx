const Statusbar = ({ 
  viewport, 
  worldCursor, 
  activeTool, 
  zoom, 
  snapEnabled, 
  gridEnabled, 
  orthoMode, 
  dynamicInput, 
  entities3D, 
  layoutTab, 
  setLayoutTab 
}) => {
  const styles = {
    statusBar: { 
      display: "flex", 
      alignItems: "center", 
      background: "#0a1322", 
      borderTop: "1px solid #23335f", 
      minHeight: 26, 
      padding: "0 8px", 
      gap: 12, 
      fontSize: 10, 
      color: "#7f9dc7", 
      flexShrink: 0 
    },
    statusLeft: { 
      display: "flex", 
      alignItems: "center", 
      gap: 8 
    },
    statusGroup: { 
      display: "flex", 
      alignItems: "center", 
      gap: 6 
    },
    statusTag: (active) => ({ 
      padding: "2px 6px", 
      borderRadius: 3, 
      border: active ? "1px solid #3f7eea" : "1px solid #23355c", 
      background: active ? "rgba(63,126,234,0.18)" : "#101826", 
      color: active ? "#e8f5ff" : "#8da4c6", 
      fontSize: 9, 
      cursor: "pointer" 
    }),
    layoutTabs: { 
      display: "flex", 
      alignItems: "center", 
      gap: 3 
    },
    layoutTab: (active) => ({ 
      padding: "3px 7px", 
      borderRadius: 3, 
      background: active ? "#0f4ec8" : "#121a30", 
      color: active ? "#eef6ff" : "#9cb5df", 
      fontSize: 9, 
      cursor: "pointer" 
    }),
    statusAccent: { 
      color: "#8ec9ff", 
      fontFamily: "'Courier New', monospace", 
      fontSize: 9 
    }
  };

  return (
    <div style={styles.statusBar}>
      <div style={styles.statusLeft}>
        <span style={styles.statusAccent}>
          {viewport === "2d" ? `X: ${worldCursor.x.toFixed(2)} Y: ${worldCursor.y.toFixed(2)}` : `3D objects: ${entities3D.length}`}
        </span>
        <span style={styles.statusAccent}>Tool: {activeTool.toUpperCase()}</span>
        <span style={styles.statusAccent}>Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={styles.statusGroup}>
        {['Snap', 'Grid', 'Ortho', 'Dyn'].map((name, index) => {
          const active = name === 'Snap' ? snapEnabled : name === 'Grid' ? gridEnabled : name === 'Ortho' ? orthoMode : dynamicInput;
          return <span key={name} style={styles.statusTag(active)}>{name}</span>;
        })}
      </div>
      <div style={styles.layoutTabs}>
        {['Model', 'Layout1', 'Layout2'].map(name => (
          <button 
            key={name} 
            onClick={() => setLayoutTab(name)} 
            style={styles.layoutTab(layoutTab === name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Statusbar;
