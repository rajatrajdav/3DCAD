import { TOOL_LABEL } from '../constants/cadConstants';

const StatusBar = ({ 
  vp, 
  worldPt, 
  objs3d, 
  selIds3d, 
  editMode, 
  grid, 
  setGrid, 
  snap, 
  setSnap, 
  orthoOn, 
  setOrthoOn, 
  dynInput, 
  setDynInput, 
  showGrid3d, 
  setShowGrid3d, 
  showAxes3d, 
  setShowAxes3d, 
  visualStyle, 
  tool, 
  layer 
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center", background: "#0078d4", height: 22, padding: "0 8px", gap: 0, flexShrink: 0, borderTop: "1px solid #005a9e" }}>
      <div style={{ color: "#fff", fontFamily: "monospace", fontSize: 10, minWidth: 200, marginRight: 8 }}>
        {vp === "2d"
          ? `${worldPt.x.toFixed(3)},  ${worldPt.y.toFixed(3)},  0.000`
          : `3D | ${objs3d.length} objects | ${selIds3d.length} selected | ${editMode.replace("_mode", "")}`}
      </div>
      {vp === "2d" && [
        { label: "MODEL", active: true, action: () => {} },
        { label: "GRID", active: grid, action: () => setGrid(g => !g) },
        { label: "SNAP", active: snap, action: () => setSnap(s => !s) },
        { label: "ORTHO", active: orthoOn, action: () => setOrthoOn(o => !o) },
        { label: "DYN", active: dynInput, action: () => setDynInput(d => !d) },
      ].map(b => (
        <div key={b.label} onClick={b.action} style={{
          padding: "0 7px", cursor: "pointer", height: 22, display: "flex", alignItems: "center",
          color: b.active ? "#fff" : "rgba(255,255,255,0.5)",
          fontSize: 10, borderRight: "1px solid rgba(255,255,255,0.15)",
          background: b.active ? "rgba(255,255,255,0.15)" : "transparent",
          fontWeight: b.active ? "bold" : "normal",
        }}>{b.label}</div>
      ))}
      {vp === "3d" && [
        { label: "GRID", active: showGrid3d, action: () => setShowGrid3d(g => !g) },
        { label: "AXES", active: showAxes3d, action: () => setShowAxes3d(a => !a) },
        { label: visualStyle.toUpperCase(), active: true, action: () => {} },
      ].map(b => (
        <div key={b.label} onClick={b.action} style={{
          padding: "0 7px", cursor: "pointer", height: 22, display: "flex", alignItems: "center",
          color: b.active ? "#fff" : "rgba(255,255,255,0.5)",
          fontSize: 10, borderRight: "1px solid rgba(255,255,255,0.15)",
          background: b.active ? "rgba(255,255,255,0.15)" : "transparent",
        }}>{b.label}</div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, padding: "0 8px", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
        {vp === "2d" ? `${TOOL_LABEL[tool] || tool} | ${layer}` : `${editMode.replace("_mode", "")} | ${visualStyle}`}
      </div>
      <div style={{ padding: "0 6px", cursor: "pointer", fontSize: 11 }} title="Notifications">🔔</div>
    </div>
  );
};

export default StatusBar;