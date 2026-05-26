const CommandLine = ({ commandInput, setCommandInput, handleCommand }) => {
  const styles = {
    cmdBar: { 
      background: "#0e1728", 
      borderTop: "1px solid #213458", 
      padding: "6px 8px", 
      display: "flex", 
      gap: 8, 
      alignItems: "center", 
      flexShrink: 0,
      minHeight: "28px"
    },
    cmdLabel: { 
      fontSize: 10, 
      color: "#78a1d1", 
      minWidth: 60 
    },
    cmdInput: { 
      background: "#14203b", 
      border: "1px solid #2f476f", 
      borderRadius: 3, 
      color: "#e4f2ff", 
      fontSize: 11, 
      padding: "6px 10px", 
      flex: 1, 
      outline: "none" 
    }
  };

  return (
    <div style={styles.cmdBar}>
      <span style={styles.cmdLabel}>Command:</span>
      <input 
        style={styles.cmdInput} 
        value={commandInput} 
        onChange={e => setCommandInput(e.target.value)} 
        onKeyDown={handleCommand} 
        placeholder="Type a command or press Enter" 
        autoComplete="off" 
        spellCheck="false" 
      />
    </div>
  );
};

export default CommandLine;
