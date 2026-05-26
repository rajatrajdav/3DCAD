const WorkspaceTabs = ({ viewport, setViewport }) => {
  const styles = {
    workspaceTabs: { 
      display: "flex", 
      alignItems: "center", 
      gap: 1, 
      padding: "0 8px", 
      minHeight: 24, 
      background: "#101826", 
      borderBottom: "1px solid #2d3e6a" 
    },
    workspaceTab: (active) => ({ 
      padding: "4px 10px", 
      cursor: "pointer", 
      borderRadius: active ? "3px 3px 0 0" : 3, 
      background: active ? "#0f4ec8" : "transparent", 
      color: active ? "#eef6ff" : "#9ab4d6", 
      fontSize: 10, 
      fontWeight: active ? 600 : 400 
    }),
    workspaceLabel: { 
      color: "#8da8cf", 
      fontSize: 9, 
      marginLeft: "auto" 
    }
  };

  const viewportTabs = [
    { id: "2d", label: "2D Drafting" },
    { id: "3d", label: "3D Model" },
  ];

  return (
    <div style={styles.workspaceTabs}>
      {viewportTabs.map(tab => (
        <button 
          key={tab.id} 
          onClick={() => setViewport(tab.id)} 
          style={styles.workspaceTab(viewport === tab.id)}
        >
          {tab.label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <span style={styles.workspaceLabel}>
        Workspace: {viewport === "2d" ? "Drafting & Annotation" : "3D Modeling"}
      </span>
    </div>
  );
};

export default WorkspaceTabs;