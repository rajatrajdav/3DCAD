const FileTabs = ({ activeFileTab, setActiveFileTab }) => {
  const styles = {
    fileTabs: { 
      display: "flex", 
      alignItems: "center", 
      gap: 1, 
      padding: "2px 8px", 
      minHeight: 24, 
      background: "#101826", 
      borderBottom: "1px solid #2e4167" 
    },
    fileTab: (active) => ({ 
      padding: "3px 12px", 
      borderRadius: "3px 3px 0 0", 
      background: active ? "#0f4ec8" : "transparent", 
      color: active ? "#eef6ff" : "#9cb5df", 
      cursor: "pointer", 
      fontSize: 10, 
      border: active ? "1px solid #1d4db5" : "1px solid transparent", 
      borderBottom: active ? "none" : "1px solid transparent" 
    }),
    tabLabel: { 
      color: "#8da8cf", 
      fontSize: 9, 
      marginLeft: "auto" 
    }
  };

  const tabs = [
    { id: 'start', label: 'Start' },
    { id: 'drawing', label: activeFileTab },
    { id: 'sheet1', label: 'Sheet1' },
  ];

  return (
    <div style={styles.fileTabs}>
      {tabs.map(tab => (
        <button 
          key={tab.id} 
          onClick={() => setActiveFileTab(tab.label)} 
          style={styles.fileTab(activeFileTab === tab.label)}
        >
          {tab.label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <span style={styles.tabLabel}>File tabs</span>
    </div>
  );
};

export default FileTabs;