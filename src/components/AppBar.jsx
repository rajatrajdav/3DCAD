import Icon from '../ui/Icon';

const AppBar = ({ 
  activeFile, 
  vp, 
  setVp, 
  searchQ, 
  setSearchQ, 
  undo, 
  redo, 
  setEntities, 
  setObjs3d, 
  pushHist 
}) => {
  const acText = "#cccccc";
  const acBorder = "#1a1a1a";

  return (
    <div style={{
      display: "flex", alignItems: "center", background: "#1e1e1e",
      borderBottom: `1px solid ${acBorder}`, height: 28, flexShrink: 0, padding: "0 4px", gap: 2,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 28, background: "#c00000", cursor: "pointer",
        color: "#fff", fontSize: 14, fontWeight: "bold", marginRight: 4, flexShrink: 0,
      }}>A</div>

      {[
        { icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", title: "New", action: () => { setEntities([]); setObjs3d([]); pushHist([]); } },
        { icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z", title: "Open" },
        { icon: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8", title: "Save" },
      ].map((b, i) => (
        <button key={i} title={b.title} onClick={b.action}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, background: "transparent", border: "none", color: acText, cursor: "pointer", borderRadius: 2 }}>
          <Icon d={b.icon} s={13} />
        </button>
      ))}

      <div style={{ width: 1, height: 14, background: "#444", margin: "0 3px" }} />
      <button onClick={undo} title="Undo Ctrl+Z" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, background: "transparent", border: "none", color: acText, cursor: "pointer" }}>
        <Icon d="M9 14L4 9l5-5M4 9h11a4 4 0 0 1 0 8h-1" s={13} />
      </button>
      <button onClick={redo} title="Redo Ctrl+Y" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, background: "transparent", border: "none", color: acText, cursor: "pointer" }}>
        <Icon d="M15 14l5-5-5-5M20 9H9a4 4 0 0 0 0 8h1" s={13} />
      </button>
      <div style={{ width: 1, height: 14, background: "#444", margin: "0 3px" }} />

      {["2d", "3d"].map(v => (
        <button key={v} onClick={() => setVp(v)} style={{
          padding: "2px 8px", background: vp === v ? "#0078d4" : "#2a2a2a",
          color: vp === v ? "#fff" : "#aaa", border: `1px solid ${vp === v ? "#0078d4" : "#555"}`,
          borderRadius: 2, cursor: "pointer", fontSize: 10, fontWeight: "bold",
        }}>{v.toUpperCase()}</button>
      ))}

      <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: acText }}>{activeFile} — 3DCAD Studio Pro</div>

      <div style={{ display: "flex", alignItems: "center", background: "#111", border: "1px solid #555", borderRadius: 2, padding: "2px 6px", gap: 4, marginRight: 6, minWidth: 150 }}>
        <Icon d="M21 21l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" s={11} c="#888" />
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search tools..."
          style={{ background: "transparent", border: "none", color: "#fff", fontSize: 10, outline: "none", width: 100 }} />
      </div>

      {["─", "□", "✕"].map((s, i) => (
        <button key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 22, background: "transparent", border: "none", color: acText, cursor: "pointer", borderRadius: 0, fontSize: 12 }}
          onMouseEnter={e => e.currentTarget.style.background = i === 2 ? "#c00000" : "#555"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >{s}</button>
      ))}
    </div>
  );
};

export default AppBar;