import Icon from './ui/Icon';
import { RIBBON, TOOL_ICONS, TOOL_LABEL, MATERIALS } from '../constants/cadConstants';

const RibbonContent = ({ 
  ribbonTab, 
  tool, 
  setTool, 
  resetDraw, 
  add3D, 
  genArchitecture, 
  addLight, 
  setEnvSettings, 
  setVp, 
  setEditMode, 
  setVisualStyle, 
  setCamAngle, 
  setCamPitch, 
  setShowGrid3d, 
  setShowAxes3d, 
  setShowMeasure3d, 
  setZoom, 
  setPan2d, 
  csz, 
  setCamDist, 
  logCmd, 
  visualStyle, 
  editMode, 
  color, 
  setColor, 
  selectedMaterial, 
  setSelectedMaterial, 
  layer, 
  setLayer, 
  layers 
}) => {
  const acRibBg = "#3c3c3c";
  const acBorder = "#1a1a1a";
  const acText = "#cccccc";
  const acDark = "#1e1e1e";
  const acDim = "#777";

  const curRibbonGroups = RIBBON[ribbonTab] || RIBBON.Home;

  const sRBtn = (active) => ({
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 0, width: 38, height: 42, borderRadius: 3, cursor: "pointer",
    background: active ? "#0078d4" : "transparent",
    border: `1px solid ${active ? "#0078d4" : "transparent"}`,
    color: active ? "#fff" : acText, padding: "2px 1px",
    transition: "all 0.1s",
  });

  return (
    <div style={{
      background: acRibBg, borderBottom: `2px solid ${acBorder}`,
      display: "flex", flexShrink: 0, height: 66, overflowX: "auto", alignItems: "stretch",
    }}>
      {Object.entries(curRibbonGroups).map(([grpName, tools]) => (
        <div key={grpName} style={{
          display: "flex", flexDirection: "column", padding: "2px 4px 0 4px",
          borderRight: `1px solid #555`, minWidth: 40,
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 1, flex: 1, alignContent: "flex-start", paddingTop: 1 }}>
            {tools.map(tid => {
              const icon = TOOL_ICONS[tid];
              const label = TOOL_LABEL[tid] || tid;
              const isActive = tool === tid || visualStyle === tid || editMode === tid;
              const is3DPrim = ["box3d", "sphere3d", "cylinder3d", "cone3d", "torus3d", "wedge3d", "pyramid3d", "plane3d", "capsule3d"].includes(tid);
              const isArch = ["wall", "door_gen", "window_gen", "stair_gen", "floor_gen", "roof_gen", "room_gen"].includes(tid);
              const isLight = ["light_point", "light_spot", "light_dir", "light_sun", "light_ambient"].includes(tid);
              const isEnv = ["sky_day", "sky_sunset", "sky_night", "env_fog", "env_water", "env_grass"].includes(tid);
              const isEditMode = ["obj_mode", "vert_mode", "edge_mode", "face_mode", "sculpt_mode"].includes(tid);
              const isVisual = ["wireframe", "hidden", "conceptual", "realistic", "shaded", "xray"].includes(tid);
              const isView = ["viewtop", "viewfront", "viewright", "viewiso"].includes(tid);
              const isMeasure = ["measure_dist", "measure_area", "measure_angle"].includes(tid);

              return (
                <div key={tid} style={sRBtn(isActive)} title={label}
                  onClick={() => {
                    if (is3DPrim) { add3D(tid); return; }
                    if (isArch) { genArchitecture(tid); return; }
                    if (isLight) {
                      const lt = tid.replace("light_", "");
                      addLight(lt); return;
                    }
                    if (isEnv) {
                      if (tid === "sky_day") setEnvSettings(e => ({ ...e, skybox: "day" }));
                      else if (tid === "sky_sunset") setEnvSettings(e => ({ ...e, skybox: "sunset" }));
                      else if (tid === "sky_night") setEnvSettings(e => ({ ...e, skybox: "night" }));
                      else if (tid === "env_fog") setEnvSettings(e => ({ ...e, fog: !e.fog }));
                      else if (tid === "env_water") setEnvSettings(e => ({ ...e, water: !e.water }));
                      else if (tid === "env_grass") setEnvSettings(e => ({ ...e, grass: !e.grass }));
                      setVp("3d"); return;
                    }
                    if (isEditMode) { setEditMode(tid); return; }
                    if (isVisual) { setVisualStyle(tid); setVp("3d"); return; }
                    if (isView) {
                      const a = { viewtop: [0, 1.5], viewfront: [0, 0], viewright: [1.57, 0], viewiso: [0.6, 0.5] };
                      const [ang, pitch] = a[tid] || [0.6, 0.5];
                      setCamAngle(ang); setCamPitch(pitch); setVp("3d"); return;
                    }
                    if (tid === "toggle_grid") { setShowGrid3d(g => !g); return; }
                    if (tid === "toggle_axes") { setShowAxes3d(a => !a); return; }
                    if (tid === "toggle_measure") { setShowMeasure3d(m => !m); return; }
                    if (tid === "zoomfit") { setZoom(1); setPan2d({ x: csz.w / 2, y: csz.h / 2 }); return; }
                    if (tid === "orbit3d") { setVp("3d"); return; }
                    if (tid === "reset_cam") { setCamAngle(0.6); setCamPitch(0.5); setCamDist(400); return; }
                    if (tid === "union3d" || tid === "subtract3d" || tid === "intersect3d") {
                      logCmd(`Boolean ${tid} — select 2+ objects first`); return;
                    }
                    if (tid === "extrude3d" || tid === "revolve3d" || tid === "shell3d") {
                      logCmd(`${TOOL_LABEL[tid]} — select a mesh first`); return;
                    }
                    if (isMeasure) { logCmd(`${TOOL_LABEL[tid]} tool active — click objects`); return; }
                    setTool(tid); resetDraw();
                  }}>
                  {icon ? <Icon d={icon} s={14} c={isActive ? "#fff" : acText} /> : <span style={{ fontSize: 9 }}>{label.slice(0, 3)}</span>}
                  <span style={{ fontSize: 7.5, textAlign: "center", lineHeight: 1, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", maxWidth: 36 }}>{label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 8, color: acDim, textAlign: "center", paddingTop: 2, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.2 }}>{grpName}</div>
        </div>
      ))}

      {/* Quick props */}
      <div style={{ display: "flex", flexDirection: "column", padding: "4px 6px", marginLeft: "auto", minWidth: 120, borderLeft: `1px solid #555` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
          <span style={{ fontSize: 9, color: acDim, width: 38 }}>Color</span>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: 22, height: 14, border: "1px solid #555", padding: 0, cursor: "pointer", background: "transparent" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
          <span style={{ fontSize: 9, color: acDim, width: 38 }}>Material</span>
          <select value={selectedMaterial} onChange={e => setSelectedMaterial(e.target.value)}
            style={{ background: acDark, color: acText, border: "1px solid #555", fontSize: 8, padding: "0 1px", flex: 1 }}>
            {Object.keys(MATERIALS).map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 9, color: acDim, width: 38 }}>Layer</span>
          <select value={layer} onChange={e => setLayer(e.target.value)}
            style={{ background: acDark, color: acText, border: "1px solid #555", fontSize: 8, padding: "0 1px", flex: 1 }}>
            {layers.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 8, color: acDim, marginTop: "auto", textAlign: "center", textTransform: "uppercase" }}>Props</div>
      </div>
    </div>
  );
};

export default RibbonContent;