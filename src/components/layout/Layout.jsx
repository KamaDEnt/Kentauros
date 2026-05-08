import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Toast from '../ui/Toast';
import AIConsole from '../ui/AIConsole';

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main className="page-container animate-in">
          {children}
        </main>
      </div>
      <Toast />
      <AIConsole />
    </div>
  );
};

export default Layout;
