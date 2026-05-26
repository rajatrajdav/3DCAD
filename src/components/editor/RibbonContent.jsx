import { TOOLS } from '../../utils/cadUtils';

const Icon = ({ d, size = 16, color = "currentColor", fill = "none", strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const RibbonContent = ({ activeTab, activeTool, setActiveTool, commandActions }) => {
  const RIBBON_GROUPS = {
    File: [
      { label: "New", tools: ["new"], large: true },
      { label: "Open", tools: ["open"], large: true },
      { label: "Save", tools: ["save"], large: true },
      { label: "Export", tools: ["export", "print"] },
    ],
    Home: [
      { label: "Draw", tools: ["line", "polyline", "rectangle", "circle", "arc"] },
      { label: "Modify", tools: ["move", "copy", "rotate", "scale", "mirror"] },
      { label: "Layers", tools: ["layer", "properties"] },
      { label: "3D", tools: ["extrude", "revolve", "sweep", "loft"] },
    ],
    Insert: [
      { label: "Block", tools: ["insert", "block", "wblock"] },
      { label: "Reference", tools: ["attach", "clip", "adjust"] },
      { label: "Import", tools: ["import", "pdf", "image"] },
    ],
    Annotate: [
      { label: "Text", tools: ["text", "mtext", "style"] },
      { label: "Dimensions", tools: ["dimension", "linear", "angular", "radius"] },
      { label: "Leaders", tools: ["leader", "qleader", "mleader"] },
    ],
    Modify: [
      { label: "Modify", tools: ["erase", "copy", "mirror", "offset", "array"] },
      { label: "Edit", tools: ["trim", "extend", "break", "join", "fillet", "chamfer"] },
    ],
    View: [
      { label: "Navigate", tools: ["pan", "zoom", "orbit", "walk"] },
      { label: "Views", tools: ["top", "front", "right", "iso"] },
      { label: "Visual", tools: ["wireframe", "hidden", "realistic", "shaded"] },
    ],
    Manage: [
      { label: "Standards", tools: ["standards", "check", "configure"] },
      { label: "Custom", tools: ["cui", "options", "settings"] },
    ],
    Output: [
      { label: "Plot", tools: ["plot", "preview", "batch"] },
      { label: "Export", tools: ["export", "pdf", "dwf", "image"] },
    ],
  };

  const styles = {
    ribbonContent: { 
      display: "flex", 
      gap: 1, 
      padding: "6px 8px", 
      overflowX: "auto", 
      background: "linear-gradient(180deg, #1e2a47, #151f37)",
      maxHeight: "88px"
    },
    ribbonGroup: { 
      display: "flex", 
      flexDirection: "column", 
      gap: 4, 
      background: "transparent", 
      border: "1px solid rgba(255,255,255,0.06)", 
      borderRadius: 4, 
      minWidth: 100, 
      padding: "4px", 
      borderBottom: "2px solid #0f4ec8" 
    },
    ribbonGroupLarge: { 
      display: "flex", 
      flexDirection: "column", 
      gap: 4, 
      background: "transparent", 
      border: "1px solid rgba(255,255,255,0.08)", 
      borderRadius: 4, 
      minWidth: 120, 
      padding: "4px", 
      borderBottom: "2px solid #0f4ec8" 
    },
    ribbonGroupHeader: { 
      fontSize: 8, 
      color: "#6b8bb3", 
      letterSpacing: "0.05em", 
      textTransform: "uppercase", 
      fontWeight: 500, 
      textAlign: "center",
      paddingBottom: 2, 
      borderBottom: "1px solid rgba(255,255,255,0.04)" 
    },
    ribbonTools: { 
      display: "flex", 
      flexWrap: "wrap", 
      gap: 2, 
      justifyContent: "center" 
    },
    ribbonToolsLarge: { 
      display: "flex", 
      gap: 3, 
      justifyContent: "center" 
    },
    ribbonButton: (active) => ({ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      gap: 2, 
      padding: "4px 3px", 
      background: active ? "#0f4ec8" : "rgba(255,255,255,0.02)", 
      border: active ? "1px solid #2971d5" : "1px solid rgba(255,255,255,0.05)", 
      borderRadius: 3, 
      color: active ? "#ffffff" : "#b1c3e0", 
      cursor: "pointer", 
      minHeight: 48, 
      minWidth: 32, 
      textAlign: "center", 
      transition: "all 0.1s ease",
      fontSize: "7px"
    }),
    ribbonButtonLarge: (active) => ({ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      gap: 4, 
      padding: "8px 6px", 
      background: active ? "#0f4ec8" : "rgba(255,255,255,0.04)", 
      border: active ? "1px solid #2971d5" : "1px solid rgba(255,255,255,0.08)", 
      borderRadius: 4, 
      color: active ? "#ffffff" : "#b1c3e0", 
      cursor: "pointer", 
      minHeight: 64, 
      minWidth: 48, 
      textAlign: "center", 
      transition: "all 0.1s ease",
      fontSize: "8px"
    }),
    ribbonButtonIcon: { 
      width: 20, 
      height: 20, 
      display: "grid", 
      placeItems: "center", 
      borderRadius: 2, 
      background: "rgba(255,255,255,0.06)" 
    },
    ribbonButtonIconLarge: { 
      width: 28, 
      height: 28, 
      display: "grid", 
      placeItems: "center", 
      borderRadius: 3, 
      background: "rgba(255,255,255,0.08)" 
    },
  };

  const getToolIcon = (tid) => {
    const iconMap = {
      new: '📄', open: '📂', save: '💾', export: '📤', print: '🖨️',
      layer: '📋', properties: '⚙️', block: '🧩', insert: '➕',
      measure: '📏', calculator: '🧮', extrude: '📦', revolve: '🔄',
      sweep: '🌊', loft: '🏔️'
    };
    return iconMap[tid] || tid.slice(0, 2).toUpperCase();
  };

  return (
    <div style={styles.ribbonContent}>
      {(RIBBON_GROUPS[activeTab] || RIBBON_GROUPS.Home).map(group => (
        <div key={group.label} style={group.large ? styles.ribbonGroupLarge : styles.ribbonGroup}>
          <div style={styles.ribbonGroupHeader}>
            {group.label}
          </div>
          <div style={group.large ? styles.ribbonToolsLarge : styles.ribbonTools}>
            {group.tools.map(tid => {
              const tool = TOOLS.find(t => t.id === tid);
              const isCommandAction = typeof commandActions?.[tid] === 'function';
              const active = activeTool === tid;
              const isLarge = group.large || ['new', 'open', 'save'].includes(tid);
              
              return (
                <button
                  key={tid}
                  onClick={() => isCommandAction ? commandActions[tid]() : setActiveTool(tid)}
                  title={tool?.label || tid.charAt(0).toUpperCase() + tid.slice(1)}
                  style={isLarge ? styles.ribbonButtonLarge(active) : styles.ribbonButton(active)}
                >
                  <div style={isLarge ? styles.ribbonButtonIconLarge : styles.ribbonButtonIcon}>
                    {tool?.icon ? (
                      <Icon d={tool.icon} size={isLarge ? 16 : 12} color={active ? "#ffffff" : "#aac2ff"} />
                    ) : (
                      <span style={{ fontSize: isLarge ? 14 : 10, fontWeight: 'bold' }}>
                        {getToolIcon(tid)}
                      </span>
                    )}
                  </div>
                  <span style={{ 
                    fontSize: isLarge ? 8 : 7, 
                    color: active ? "#ffffff" : "#b5c6e3", 
                    lineHeight: 1.1,
                    textAlign: 'center',
                    fontWeight: isLarge ? 500 : 400,
                    maxWidth: isLarge ? "44px" : "28px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {tool?.label || tid.charAt(0).toUpperCase() + tid.slice(1)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RibbonContent;