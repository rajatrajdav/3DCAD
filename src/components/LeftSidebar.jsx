import Icon from './ui/Icon';
import { ASSET_LIBRARY, TOOL_ICONS, TOOL_LABEL } from '../constants/cadConstants';

const LeftSidebar = ({ 
  sidebarTab, 
  setSidebarTab, 
  tool, 
  setTool, 
  resetDraw, 
  add3D, 
  genArchitecture, 
  addLight, 
  setEditMode, 
  setCamAngle, 
  setCamPitch, 
  setCamDist, 
  visualStyle, 
  editMode, 
  selIds3d, 
  duplicate3D, 
  mirror3D, 
  del3D, 
  addFromLibrary, 
  sceneNodes, 
  renderTree, 
  objs3d, 
  setSelIds3d 
}) => {
  const acDark = "#1e1e1e";
  const acBg = "#2d2d30";
  const acBorder = "#1a1a1a";
  const acText = "#cccccc";
  const acLt = "#ffffff";
  const acDim = "#777";

  return (
    <div style={{ width: 180, background: acDark, borderRight: `1px solid ${acBorder}`, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
      {/* Sidebar tabs */}
      <div style={{ display: "flex", background: acBg, borderBottom: `1px solid ${acBorder}`, flexShrink: 0 }}>
        {[{ id: "tools", l: "Tools" }, { id: "assets", l: "Assets" }, { id: "scene", l: "Scene" }].map(t => (
          <div key={t.id} onClick={() => setSidebarTab(t.id)} style={{
            flex: 1, textAlign: "center", padding: "4px 0", cursor: "pointer", fontSize: 9,
            color: sidebarTab === t.id ? acLt : acDim,
            borderBottom: sidebarTab === t.id ? "2px solid #0078d4" : "2px solid transparent",
          }}>{t.l}</div>
        ))}
      </div>

      {/* TOOLS sidebar */}
      {sidebarTab === "tools" && (
        <div style={{ overflow: "auto", flex: 1, padding: 4 }}>
          {[
            { label: "SELECT", tools: [{ id: "select", icon: TOOL_ICONS.select, label: "Select" }] },
            { label: "TRANSFORM", tools: [{ id: "move", icon: TOOL_ICONS.move, label: "Move (G)" }, { id: "rotate", icon: TOOL_ICONS.rotate, label: "Rotate (R)" }, { id: "scale", icon: TOOL_ICONS.scale, label: "Scale (S)" }] },
            { label: "PRIMITIVES", tools: ["box3d", "sphere3d", "cylinder3d", "cone3d", "torus3d", "plane3d", "capsule3d", "pyramid3d"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
            { label: "ARCHITECTURE", tools: ["wall", "door_gen", "window_gen", "stair_gen", "floor_gen", "roof_gen", "room_gen"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
            { label: "LIGHTS", tools: ["light_point", "light_spot", "light_dir", "light_sun"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
            { label: "CAMERA", tools: [{ id: "orbit3d", icon: TOOL_ICONS.orbit3d, label: "Orbit" }, { id: "pan", icon: TOOL_ICONS.pan, label: "Pan" }, { id: "zoom", icon: TOOL_ICONS.zoom, label: "Zoom" }, { id: "reset_cam", icon: TOOL_ICONS.reset_cam, label: "Reset" }] },
            { label: "EDIT MODE", tools: ["obj_mode", "vert_mode", "edge_mode", "face_mode", "sculpt_mode"].map(id => ({ id, icon: TOOL_ICONS[id], label: TOOL_LABEL[id] })) },
          ].map(group => (
            <div key={group.label} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 8, color: acDim, padding: "2px 2px 2px 2px", letterSpacing: "0.06em", borderBottom: `1px solid #2a2a2a`, marginBottom: 2 }}>{group.label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {group.tools.map(t => {
                  const isActive = tool === t.id || visualStyle === t.id || editMode === t.id;
                  return (
                    <div key={t.id} title={t.label}
                      onClick={() => {
                        const is3DPrim2 = ["box3d", "sphere3d", "cylinder3d", "cone3d", "torus3d", "wedge3d", "pyramid3d", "plane3d", "capsule3d"].includes(t.id);
                        const isArch2 = ["wall", "door_gen", "window_gen", "stair_gen", "floor_gen", "roof_gen", "room_gen"].includes(t.id);
                        const isLt2 = ["light_point", "light_spot", "light_dir", "light_sun"].includes(t.id);
                        const isEM = ["obj_mode", "vert_mode", "edge_mode", "face_mode", "sculpt_mode"].includes(t.id);
                        if (is3DPrim2) { add3D(t.id); return; }
                        if (isArch2) { genArchitecture(t.id); return; }
                        if (isLt2) { addLight(t.id.replace("light_", "")); return; }
                        if (isEM) { setEditMode(t.id); return; }
                        if (t.id === "reset_cam") { setCamAngle(0.6); setCamPitch(0.5); setCamDist(400); return; }
                        setTool(t.id); resetDraw();
                      }}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        width: 40, height: 38, borderRadius: 3, cursor: "pointer", gap: 1,
                        background: isActive ? "#0078d4" : "#2a2a2a",
                        border: `1px solid ${isActive ? "#0078d4" : "#444"}`,
                        color: isActive ? "#fff" : acText,
                      }}>
                      {t.icon ? <Icon d={t.icon} s={14} c={isActive ? "#fff" : acText} /> : <span style={{ fontSize: 10 }}>{t.label.slice(0, 2)}</span>}
                      <span style={{ fontSize: 7, whiteSpace: "nowrap", overflow: "hidden", maxWidth: 38 }}>{t.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {/* 3D selection quick actions */}
          {selIds3d.length > 0 && (
            <div style={{ borderTop: `1px solid #333`, marginTop: 6, paddingTop: 6 }}>
              <div style={{ fontSize: 8, color: acDim, marginBottom: 4 }}>SELECTION ({selIds3d.length})</div>
              {[
                { l: "Duplicate", a: duplicate3D },
                { l: "Mirror X", a: () => mirror3D("x") },
                { l: "Mirror Z", a: () => mirror3D("z") },
                { l: "Delete", a: del3D },
              ].map(b => (
                <button key={b.l} onClick={b.a} style={{
                  display: "block", width: "100%", marginBottom: 2, padding: "3px 6px",
                  background: b.l === "Delete" ? "#661111" : "#2a3a4a", border: `1px solid #444`,
                  color: "#ccc", borderRadius: 2, cursor: "pointer", fontSize: 9, textAlign: "left",
                }}>{b.l}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ASSETS sidebar */}
      {sidebarTab === "assets" && (
        <div style={{ overflow: "auto", flex: 1 }}>
          {Object.entries(ASSET_LIBRARY).map(([cat, items]) => (
            <div key={cat}>
              <div style={{ fontSize: 8, color: acDim, padding: "4px 6px 2px", background: "#1a1a1a", borderBottom: `1px solid #111`, letterSpacing: "0.06em" }}>{cat.toUpperCase()}</div>
              {items.map(asset => (
                <div key={asset.id} onClick={() => addFromLibrary(asset)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 8px",
                    cursor: "pointer", borderBottom: `1px solid #111`, fontSize: 10,
                    color: acText,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a3a5a"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ width: 10, height: 10, background: asset.color, borderRadius: 2, flexShrink: 0, display: "inline-block", border: "1px solid #666" }} />
                  <span style={{ flex: 1 }}>{asset.label}</span>
                  <span style={{ fontSize: 8, color: acDim }}>+</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* SCENE sidebar */}
      {sidebarTab === "scene" && (
        <div style={{ overflow: "auto", flex: 1 }}>
          <div style={{ fontSize: 8, color: acDim, padding: "4px 6px", background: "#1a1a1a", borderBottom: `1px solid #111` }}>SCENE HIERARCHY</div>
          {renderTree(sceneNodes)}
          <div style={{ borderTop: `1px solid #222`, padding: "4px 8px" }}>
            <div style={{ fontSize: 8, color: acDim, marginBottom: 4 }}>OBJECTS IN SCENE: {objs3d.length}</div>
            {objs3d.map(o => (
              <div key={o.id} onClick={() => setSelIds3d(prev => prev.includes(o.id) ? prev.filter(i => i !== o.id) : [...prev, o.id])}
                style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "2px 4px",
                  cursor: "pointer", borderRadius: 2, marginBottom: 1, fontSize: 9,
                  background: selIds3d.includes(o.id) ? "#1a3a5a" : "transparent",
                  borderLeft: selIds3d.includes(o.id) ? "2px solid #0078d4" : "2px solid transparent",
                }}>
                <span style={{ width: 8, height: 8, background: o.material?.color || o.color, borderRadius: 1, flexShrink: 0, display: "inline-block" }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.shape.replace("3d", "")}</span>
                <span style={{ color: acDim, fontSize: 8 }}>#{o.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;