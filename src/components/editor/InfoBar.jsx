const InfoBar = ({ activeFileTab, project, statusInfo, viewport, ucsIcon, entities3D }) => {
  const styles = {
    infoBar: { 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      padding: "3px 10px", 
      background: "#101826", 
      borderBottom: "1px solid #243360", 
      color: "#8da4c6", 
      fontSize: 10,
      minHeight: "20px"
    }
  };

  return (
    <div style={styles.infoBar}>
      <span>{activeFileTab} — {project?.name || 'Untitled'}</span>
      <span>{statusInfo}</span>
      <span>
        {viewport === '2d' ? `UCS: ${ucsIcon ? 'On' : 'Off'}` : `Objects: ${entities3D.length}`}
      </span>
    </div>
  );
};

export default InfoBar;