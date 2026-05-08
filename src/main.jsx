import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './context/AppContext';
import { DataProvider } from './context/DataContext';
import { I18nProvider } from './context/I18nContext';
import { AuditProvider } from './context/AuditContext';
import { LogsProvider } from './context/LogsContext';
import { MetricsProvider } from './context/MetricsContext';
import './index.css';
import './styles/i18n.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <AppProvider>
        <AuditProvider>
          <LogsProvider>
            <DataProvider>
              <MetricsProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </MetricsProvider>
            </DataProvider>
          </LogsProvider>
        </AuditProvider>
      </AppProvider>
    </I18nProvider>
  </React.StrictMode>
);
