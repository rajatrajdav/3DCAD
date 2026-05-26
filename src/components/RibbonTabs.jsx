const RibbonTabs = ({ 
  ribbonTab, 
  setRibbonTab, 
  snap, 
  setSnap, 
  grid, 
  setGrid, 
  showGrid3d, 
  setShowGrid3d, 
  orthoOn, 
  setOrthoOn, 
  dynInput, 
  setDynInput 
}) => {
  const acBg = "#2d2d30";
  const acRibBg = "#3c3c3c";
  const acBorder = "#1a1a1a";
  const acLt = "#ffffff";
  const acDim = "#777";

  const RIBBON = {
    Home: {
      Draw: ["line", "circle", "rect", "arc", "ellipse", "spline", "polyline", "hatch", "text"],
      Modify: ["move", "copy", "rotate", "mirror", "scale", "trim", "extend", "offset", "fillet", "erase"],
      Annotate: ["dim", "leader", "mtext"],
      View: ["pan", "zoom", "zoomfit"],
    },
    Solid3D: {
      Primitives: ["box3d", "sphere3d", "cylinder3d", "cone3d", "torus3d", "wedge3d", "pyramid3d", "plane3d", "capsule3d"],
      Boolean: ["union3d", "subtract3d", "intersect3d"],
      Edit3D: ["extrude3d", "revolve3d", "shell3d"],
      Surface: ["planarsurface", "ruledsurf"],
    },
    Architecture: {
      Generate: ["wall", "door_gen", "window_gen", "stair_gen", "floor_gen", "roof_gen", "room_gen"],
      Measure: ["measure_dist", "measure_area", "measure_angle"],
    },
    Modeling: {
      Mesh: ["extrude_face", "inset_face", "bevel_edge", "loop_cut", "knife", "merge_verts", "subdivide"],
      EditMode: ["obj_mode", "vert_mode", "edge_mode", "face_mode", "sculpt_mode"],
      Sculpt: ["sc_inflate", "sc_smooth", "sc_grab", "sc_clay", "sc_pinch"],
    },
    Lighting: {
      Lights: ["light_point", "light_spot", "light_dir", "light_sun", "light_ambient"],
      Environment: ["sky_day", "sky_sunset", "sky_night", "env_fog", "env_water", "env_grass"],
    },
    View: {
      Navigate: ["pan", "zoom", "orbit3d", "walk", "flymode", "reset_cam"],
      Views: ["viewtop", "viewfront", "viewright", "viewiso"],
      Visual: ["wireframe", "hidden", "conceptual", "realistic", "shaded", "xray"],
      Display: ["toggle_grid", "toggle_axes", "toggle_measure"],
    },
    Output: {
      Plot: ["plot", "exportpdf", "exportstl"],
      Settings: ["pagesetup"],
    },
  };

  return (
    <div style={{ display: "flex", alignItems: "flex-end", background: acBg, borderBottom: `1px solid ${acBorder}`, height: 24, padding: "0 4px", flexShrink: 0 }}>
      {Object.keys(RIBBON).map(tab => (
        <div key={tab} onClick={() => setRibbonTab(tab)} style={{
          padding: "3px 10px", cursor: "pointer", fontSize: 10,
          background: ribbonTab === tab ? acRibBg : "transparent",
          color: ribbonTab === tab ? acLt : acDim,
          borderTop: ribbonTab === tab ? "1px solid #666" : "1px solid transparent",
          borderLeft: ribbonTab === tab ? "1px solid #666" : "1px solid transparent",
          borderRight: ribbonTab === tab ? "1px solid #666" : "1px solid transparent",
          borderBottom: ribbonTab === tab ? `1px solid ${acRibBg}` : "1px solid transparent",
          borderRadius: "3px 3px 0 0", marginBottom: ribbonTab === tab ? -1 : 0, zIndex: ribbonTab === tab ? 2 : 1, position: "relative",
        }}>{tab}</div>
      ))}
      <div style={{ flex: 1 }} />
      {[
        { label: "SNAP", active: snap, action: () => setSnap(s => !s) },
        { label: "GRID", active: grid || showGrid3d, action: () => { setGrid(g => !g); setShowGrid3d(g => !g); } },
        { label: "ORTHO", active: orthoOn, action: () => setOrthoOn(o => !o) },
        { label: "DYN", active: dynInput, action: () => setDynInput(d => !d) },
      ].map(b => (
        <div key={b.label} onClick={b.action} style={{
          padding: "0 6px", cursor: "pointer", fontSize: 9, display: "flex", alignItems: "center",
          color: b.active ? "#00d4ff" : acDim, fontWeight: b.active ? "bold" : "normal",
          borderLeft: "1px solid #444",
        }}>{b.label}</div>
      ))}
    </div>
  );
};

export default RibbonTabs;