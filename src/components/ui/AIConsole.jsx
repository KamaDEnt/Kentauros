import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/ai/aiService';
import Button from './Button';
import Badge from './Badge';

const AIConsole = () => {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState(null);

  useEffect(() => {
    setLogs(aiService.getLogs());
    const unsubscribe = aiService.subscribe((newLogs) => {
      setLogs(newLogs);
      // Auto-open on new log if it's a success or if we want to show activity
      if (newLogs.length > 0 && !isOpen) {
        // Option to auto-open here
      }
    });
    return unsubscribe;
  }, []);

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'var(--text-success)';
      case 'error': return 'var(--text-danger)';
      case 'warning': return 'var(--text-warning)';
      default: return 'var(--text-info)';
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div 
        className="ai-console-toggle"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <Button 
          variant="accent" 
          onClick={() => setIsOpen(!isOpen)}
          className="animate-pulse"
          style={{ borderRadius: '50px', padding: '0.75rem 1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
        >
          {isOpen ? 'Close Console' : 'AI Console'}
          {logs.some(l => l.type === 'success') && !isOpen && (
            <span style={{ 
              position: 'absolute', 
              top: '-5px', 
              right: '-5px', 
              background: 'var(--accent-color)', 
              borderRadius: '50%', 
              width: '12px', 
              height: '12px',
              border: '2px solid var(--bg-primary)'
            }}></span>
          )}
        </Button>
      </div>

      {/* Slide-over Console */}
      <div 
        className={`ai-console-panel ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : '-400px',
          width: '400px',
          height: '100vh',
          background: 'rgba(15, 15, 20, 0.95)',
          backdropFilter: 'blur(10px)',
          borderLeft: '1px solid var(--border-color)',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className="m-0" style={{ fontSize: '1.1rem', color: 'var(--accent-color)' }}>Execution Logs</h3>
          <Badge variant="secondary">{logs.length} events</Badge>
        </div>

        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem',
            paddingRight: '0.5rem'
          }}
          className="custom-scrollbar"
        >
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.5 }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
              <p>No agent activity yet.</p>
            </div>
          ) : (
            logs.map(log => (
              <div 
                key={log.id} 
                style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${getLogColor(log.type)}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.25rem' }}>
                  <span className="font-bold">{log.agentName}</span>
                  <span>{log.timestamp}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: log.type === 'success' ? 'var(--text-success)' : 'inherit' }}>
                  {log.message}
                </div>
                {log.output && (
                  <Button 
                    variant="ghost" 
                    size="xs" 
                    style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--accent-color)' }}
                    onClick={() => setSelectedOutput(log)}
                  >
                    View Output
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => { aiService.logs = []; aiService.notify(); }}>Clear History</Button>
        </div>
      </div>

      {/* Output Viewer (Simple Modal-like) */}
      {selectedOutput && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setSelectedOutput(null)}
        >
          <div 
            style={{
              background: 'var(--bg-primary)',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '80vh',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="m-0">{selectedOutput.agentName} - Generated Output</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOutput(null)}>✕</Button>
            </div>
            <div 
              style={{ 
                padding: '1.5rem', 
                overflowY: 'auto', 
                background: 'var(--bg-secondary)', 
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap',
                color: 'var(--text-secondary)'
              }}
            >
              {selectedOutput.output}
            </div>
            <div style={{ padding: '1rem', textAlign: 'right', borderTop: '1px solid var(--border-color)' }}>
              <Button variant="primary" onClick={() => {
                navigator.clipboard.writeText(selectedOutput.output);
                alert('Copied to clipboard!');
              }}>Copy to Clipboard</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIConsole;
