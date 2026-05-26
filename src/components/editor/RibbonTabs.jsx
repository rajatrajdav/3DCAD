const RibbonTabs = ({ 
  tabs, 
  activeTab, 
  setActiveTab, 
  snapEnabled, 
  setSnapEnabled,
  gridEnabled, 
  setGridEnabled,
  orthoMode, 
  setOrthoMode,
  dynamicInput, 
  setDynamicInput 
}) => {
  const styles = {
    ribbonTabs: { 
      display: "flex", 
      alignItems: "center", 
      padding: "4px 10px", 
      gap: 2, 
      borderBottom: "1px solid #293959",
      minHeight: "28px"
    },
    ribbonTab: (active) => ({ 
      padding: "6px 14px", 
      cursor: "pointer", 
      fontSize: 11, 
      fontWeight: active ? 600 : 400, 
      color: active ? "#ffffff" : "#a5b8d8", 
      background: active ? "#0f4ec8" : "transparent", 
      borderRadius: active ? "4px 4px 0 0" : 4,
      border: active ? "1px solid #2971d5" : "1px solid transparent",
      borderBottom: active ? "none" : "1px solid transparent"
    }),
    ribbonQuick: { 
      display: "flex", 
      alignItems: "center", 
      gap: 3, 
      marginLeft: "auto" 
    },
    quickButton: (active) => ({ 
      width: 24, 
      height: 24, 
      borderRadius: 3, 
      border: active ? "1px solid #3f7eea" : "1px solid #2d3a5f", 
      background: active ? "#0f57d1" : "#0f1830", 
      color: active ? "#e4f3ff" : "#9bb5d9", 
      display: "grid", 
      placeItems: "center", 
      cursor: "pointer",
      fontSize: "8px",
      fontWeight: "bold"
    })
  };

  return (
    <div style={styles.ribbonTabs}>
      {tabs.map(tab => (
        <div 
          key={tab} 
          style={styles.ribbonTab(activeTab === tab)} 
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={styles.ribbonQuick}>
        <button 
          onClick={() => setSnapEnabled(s => !s)} 
          style={styles.quickButton(snapEnabled)} 
          title="Object Snap"
        >
          SNAP
        </button>
        <button 
          onClick={() => setGridEnabled(g => !g)} 
          style={styles.quickButton(gridEnabled)} 
          title="Grid Display"
        >
          GRID
        </button>
        <button 
          onClick={() => setOrthoMode(o => !o)} 
          style={styles.quickButton(orthoMode)} 
          title="Ortho Mode"
        >
          ORTH
        </button>
        <button 
          onClick={() => setDynamicInput(d => !d)} 
          style={styles.quickButton(dynamicInput)} 
          title="Dynamic Input"
        >
          DYN
        </button>
      </div>
    </div>
  );
};

export default RibbonTabs;