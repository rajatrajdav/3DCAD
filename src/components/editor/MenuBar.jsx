const MenuBar = ({ undo, redo, navigate, project }) => {
  const styles = {
    menuBar: { 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      background: "#131a2c", 
      borderBottom: "1px solid #334168", 
      height: 28, 
      padding: "0 8px", 
      gap: 6, 
      fontSize: 11, 
      flexShrink: 0 
    },
    appTitle: { 
      display: "flex", 
      alignItems: "center", 
      gap: 8, 
      color: "#d4e7ff", 
      fontWeight: 600, 
      letterSpacing: "0.03em" 
    },
    appButton: { 
      display: "grid", 
      placeItems: "center", 
      width: 22, 
      height: 22, 
      borderRadius: 3, 
      border: "1px solid #2e4164", 
      background: "#0f1830", 
      color: "#8db8ff", 
      cursor: "pointer",
      fontSize: "10px",
      fontWeight: "bold"
    },
    quickAccess: { 
      display: "flex", 
      alignItems: "center", 
      gap: 3 
    },
    quickButton: (active) => ({ 
      width: 24, 
      height: 24, 
      borderRadius: 3, 
      border: "1px solid #2d3a5f", 
      background: active ? "#0f57d1" : "#0f1830", 
      color: active ? "#e4f3ff" : "#9bb5d9", 
      display: "grid", 
      placeItems: "center", 
      cursor: "pointer",
      fontSize: "10px"
    }),
    actionButton: { 
      background: "transparent", 
      border: "1px solid #22345a", 
      color: "#a2bbdb", 
      borderRadius: 3, 
      fontSize: 10, 
      padding: "3px 6px", 
      cursor: "pointer" 
    },
    primaryButton: { 
      background: "#0f4ec8", 
      border: "1px solid #2a5fd3", 
      color: "#fff", 
      borderRadius: 3, 
      fontSize: 10, 
      padding: "3px 8px", 
      cursor: "pointer" 
    }
  };

  return (
    <div style={styles.menuBar}>
      <div style={styles.appTitle}>
        <button style={styles.appButton} title="Application menu">A</button>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{ fontSize: 10 }}>AutoCAD 3D</span>
          <span style={{ fontSize: 8, color: "#92b7ff" }}>Professional</span>
        </div>
        <div style={styles.quickAccess}>
          <button style={styles.quickButton(false)} title="Save">💾</button>
          <button style={styles.quickButton(false)} title="Undo" onClick={undo}>↶</button>
          <button style={styles.quickButton(false)} title="Redo" onClick={redo}>↷</button>
          <button style={styles.quickButton(false)} title="New">✚</button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button onClick={undo} style={styles.actionButton}>Undo</button>
        <button onClick={redo} style={styles.actionButton}>Redo</button>
        <button onClick={() => navigate("/projects")} style={styles.primaryButton}>Projects</button>
      </div>
    </div>
  );
};

export default MenuBar;