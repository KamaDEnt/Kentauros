import React, { useState, useEffect } from 'react';
import { openCodeService } from '../services/openCodeService';
import { Terminal, Folder, FileJson, FileCode2, Play, Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './Prototypes.css'; // Reuse some basic layout styles if possible, or define inline
import { useApp } from '../context/AppContext';
import { useData } from '../context/DataContext';

export default function CodeGenerator() {
  const { addNotification } = useApp();
  const { addLearningEvent } = useData();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    setProjects(openCodeService.getAllProjects());
  }, []);

  const handleSelectProject = (proj) => {
    setSelectedProject(proj);
    const files = Object.keys(proj.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleDownloadBundle = async () => {
    if (!selectedProject) return;
    
    const zip = new JSZip();
    
    // Add files to zip
    Object.entries(selectedProject.files).forEach(([filename, content]) => {
      zip.file(filename, content);
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${selectedProject.client_name.replace(/\\s+/g, '_').toLowerCase()}_opencode.zip`);
      addLearningEvent({
        source: 'development',
        event_type: 'code_bundle_downloaded',
        title: `Pacote baixado - ${selectedProject.client_name}`,
        content: 'Pacote de código gerado pela IA baixado para validação local.',
        tags: ['CodeGenerator', 'Download'],
        metadata: { projectId: selectedProject.id },
      });
      addNotification('Pacote gerado', 'Bundle baixado com rastreabilidade no aprendizado contínuo.', 'success');
    } catch (error) {
      console.error('Failed to generate zip:', error);
      addNotification('Erro', 'Erro ao gerar o pacote ZIP.', 'error');
    }
  };

  const renderIcon = (filename) => {
    if (filename.endsWith('.json')) return <FileJson size={16} className="text-yellow-500" />;
    if (filename.endsWith('.jsx') || filename.endsWith('.js')) return <FileCode2 size={16} className="text-blue-400" />;
    if (filename.endsWith('.css')) return <FileCode2 size={16} className="text-pink-400" />;
    return <FileCode2 size={16} />;
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Terminal className="text-green-400" size={32} />
            OpenCode Workspace
          </h1>
          <p className="page-subtitle">Projetos gerados automaticamente pelo motor de IA</p>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, gap: '2rem', marginTop: '2rem', height: 'calc(100vh - 200px)' }}>
        {/* Sidebar: Projects List */}
        <aside style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1rem', color: '#8892b0', textTransform: 'uppercase', letterSpacing: '1px' }}>Projetos Gerados</h3>
          {projects.length === 0 ? (
            <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Nenhum projeto gerado ainda.</p>
          ) : (
            projects.map(proj => (
              <div 
                key={proj.id} 
                onClick={() => handleSelectProject(proj)}
                style={{
                  background: selectedProject?.id === proj.id ? 'rgba(100, 255, 218, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${selectedProject?.id === proj.id ? '#64ffda' : 'transparent'}`,
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: selectedProject?.id === proj.id ? '#64ffda' : 'white' }}>{proj.client_name}</h4>
                  <span style={{ fontSize: '0.7rem', background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>QA Pending</span>
                </div>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', opacity: 0.6 }}>
                  {new Date(proj.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            ))
          )}
        </aside>

        {/* Main Area: Files and Code Viewer */}
        <main style={{ flex: 1, display: 'flex', background: '#0a192f', borderRadius: '12px', border: '1px solid #1e2d3d', overflow: 'hidden' }}>
          {!selectedProject ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#8892b0' }}>
              <Terminal size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <h2>Selecione um projeto para explorar o código</h2>
            </div>
          ) : (
            <>
              {/* File Explorer */}
              <div style={{ width: '250px', background: '#112240', borderRight: '1px solid #1e2d3d', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #1e2d3d', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ccd6f6', fontWeight: 'bold' }}>
                  <Folder size={18} /> src/
                </div>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.keys(selectedProject.files).map(filename => (
                    <div 
                      key={filename}
                      onClick={() => setSelectedFile(filename)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: selectedFile === filename ? 'rgba(100, 255, 218, 0.1)' : 'transparent',
                        color: selectedFile === filename ? '#64ffda' : '#8892b0',
                        fontSize: '0.9rem'
                      }}
                    >
                      {renderIcon(filename)}
                      {filename}
                    </div>
                  ))}
                </div>
                
                {/* Build logs simulator */}
                <div style={{ marginTop: 'auto', borderTop: '1px solid #1e2d3d', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Play size={12} /> Execution Logs
                  </h4>
                  <div style={{ height: '100px', overflowY: 'auto', fontSize: '0.75rem', fontFamily: 'monospace', color: '#a8b2d1' }}>
                    {selectedProject.logs.map((log, i) => (
                      <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
                    ))}
                    <div style={{ color: '#64ffda', marginTop: '8px' }}>[SUCCESS] Project bundled and ready.</div>
                  </div>
                </div>
              </div>

              {/* Code Editor View */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a192f' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #1e2d3d', color: '#ccd6f6', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{selectedFile || 'No file selected'}</span>
                  <button 
                    onClick={handleDownloadBundle}
                    style={{ background: '#64ffda', color: '#0a192f', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Download size={14} /> Download Bundle
                  </button>
                </div>
                <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
                  {selectedFile ? (
                    <pre style={{ 
                      margin: 0, 
                      fontFamily: '"Fira Code", monospace', 
                      fontSize: '0.9rem', 
                      color: '#ccd6f6',
                      lineHeight: '1.5'
                    }}>
                      <code>{selectedProject.files[selectedFile]}</code>
                    </pre>
                  ) : (
                    <div style={{ color: '#8892b0', textAlign: 'center', marginTop: '2rem' }}>Selecione um arquivo</div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
