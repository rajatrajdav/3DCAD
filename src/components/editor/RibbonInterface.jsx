import { useState } from 'react';
import RibbonTabs from './RibbonTabs';
import RibbonContent from './RibbonContent';

const RibbonInterface = ({ 
  activeRibbonTab, 
  setActiveRibbonTab, 
  activeTool, 
  setActiveTool, 
  commandActions,
  snapEnabled, 
  setSnapEnabled,
  gridEnabled, 
  setGridEnabled,
  orthoMode, 
  setOrthoMode,
  dynamicInput, 
  setDynamicInput,
  showRibbon,
  setShowRibbon 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const RIBBON_TABS = ["File", "Home", "Insert", "Annotate", "Modify", "View", "Manage", "Output"];

  const styles = {
    ribbon: { 
      display: "flex", 
      flexDirection: "column", 
      background: "linear-gradient(180deg,#1b243f,#111827)", 
      borderBottom: "1px solid #263a62", 
      flexShrink: 0, 
      color: "#d8ebff",
      height: isCollapsed ? "32px" : "120px",
      transition: "height 0.2s ease"
    },
    collapseBtn: {
      position: "absolute",
      right: "10px",
      top: "6px",
      background: "transparent",
      border: "1px solid #334168",
      color: "#8db8ff",
      borderRadius: "3px",
      padding: "2px 6px",
      fontSize: "10px",
      cursor: "pointer",
      zIndex: 10
    }
  };

  if (!showRibbon) return null;

  return (
    <div style={styles.ribbon}>
      <button 
        style={styles.collapseBtn}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand Ribbon" : "Collapse Ribbon"}
      >
        {isCollapsed ? "▼" : "▲"}
      </button>
      
      <RibbonTabs 
        tabs={RIBBON_TABS}
        activeTab={activeRibbonTab}
        setActiveTab={setActiveRibbonTab}
        snapEnabled={snapEnabled}
        setSnapEnabled={setSnapEnabled}
        gridEnabled={gridEnabled}
        setGridEnabled={setGridEnabled}
        orthoMode={orthoMode}
        setOrthoMode={setOrthoMode}
        dynamicInput={dynamicInput}
        setDynamicInput={setDynamicInput}
      />
      
      {!isCollapsed && (
        <RibbonContent 
          activeTab={activeRibbonTab}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          commandActions={commandActions}
        />
      )}
    </div>
  );
};

export default RibbonInterface;