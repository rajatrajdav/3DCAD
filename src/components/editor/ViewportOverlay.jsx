const ViewportOverlay = () => {
  const styles = {
    viewportOverlay: { 
      position: "absolute", 
      right: 12, 
      top: 12, 
      display: "flex", 
      flexDirection: "column", 
      gap: 6, 
      zIndex: 10 
    },
    overlayButton: { 
      width: 36, 
      height: 36, 
      borderRadius: 6, 
      border: "1px solid rgba(255,255,255,0.08)", 
      background: "rgba(15,24,56,0.85)", 
      color: "#dbe8ff", 
      display: "grid", 
      placeItems: "center", 
      cursor: "pointer",
      fontSize: "14px"
    }
  };

  return (
    <div style={styles.viewportOverlay}>
      <button style={styles.overlayButton} title="View Cube">🧭</button>
      <button style={styles.overlayButton} title="Navigation Bar">⎋</button>
    </div>
  );
};

export default ViewportOverlay;