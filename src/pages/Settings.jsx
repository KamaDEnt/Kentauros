import React, { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Switch from '../components/ui/Switch';
import { useI18n } from '../context/I18nContext';
import { LANGUAGES } from '../data/languages';
import { Building, Globe, Mail, Moon, Zap, Bell, Check, Languages, Info, Shield, Download, RefreshCw, Trash2 } from 'lucide-react';

const SETTINGS_KEY = 'kentauros_settings';

const Settings = () => {
  const { t, language, setLanguage } = useI18n();
  const [langSaved, setLangSaved] = useState(false);
  const [settings, setSettings] = useState(() => JSON.parse(localStorage.getItem(SETTINGS_KEY) || JSON.stringify({
    companyName: 'Kentauros Consulting',
    websiteUrl: 'https://kentauros.consulting',
    contactEmail: 'ops@kentauros.consulting',
    realTimeSync: true,
    emailNotifications: false,
  })));

  const handleLangChange = (code) => {
    setLanguage(code);
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 2500);
  };

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 2500);
  };

  return (
    <div className="settings-page animate-fade-in">
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <div className="grid grid-3">
        <div className="col-span-2">
          <Card title={t('settings.orgProfile')}>
            <div className="flex flex-col gap-md">
              <Input 
                label={t('settings.companyName')} 
                value={settings.companyName}
                onChange={event => setSettings(prev => ({ ...prev, companyName: event.target.value }))}
                icon={<Building size={18} />}
              />
              <Input 
                label={t('settings.websiteUrl')} 
                value={settings.websiteUrl}
                onChange={event => setSettings(prev => ({ ...prev, websiteUrl: event.target.value }))}
                icon={<Globe size={18} />}
              />
              <Input 
                label={t('settings.contactEmail')} 
                type="email" 
                value={settings.contactEmail}
                onChange={event => setSettings(prev => ({ ...prev, contactEmail: event.target.value }))}
                icon={<Mail size={18} />}
              />
              <div className="mt-sm">
                <Button variant="primary" onClick={saveSettings}>{t('settings.saveProfile')}</Button>
              </div>
            </div>
          </Card>

          <Card title={t('settings.preferences')} className="mt-lg">
            <div className="flex flex-col gap-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <div className="p-xs bg-secondary border-radius-sm text-accent"><Moon size={18} /></div>
                  <div>
                    <div className="text-sm font-bold">{t('settings.darkMode')}</div>
                    <div className="text-xs text-muted">{t('settings.darkModeDesc')}</div>
                  </div>
                </div>
                <Switch checked={settings.realTimeSync} onChange={() => setSettings(prev => ({ ...prev, realTimeSync: !prev.realTimeSync }))} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <div className="p-xs bg-secondary border-radius-sm text-success"><Zap size={18} /></div>
                  <div>
                    <div className="text-sm font-bold">{t('settings.realTimeSync')}</div>
                    <div className="text-xs text-muted">{t('settings.realTimeSyncDesc')}</div>
                  </div>
                </div>
                <Switch checked readOnly />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <div className="p-xs bg-secondary border-radius-sm text-warning"><Bell size={18} /></div>
                  <div>
                    <div className="text-sm font-bold">{t('settings.emailNotifications')}</div>
                    <div className="text-xs text-muted">{t('settings.emailNotificationsDesc')}</div>
                  </div>
                </div>
                <Switch checked={settings.emailNotifications} onChange={() => setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))} />
              </div>
            </div>
          </Card>

          {/* Language Section */}
          <Card title={t('settings.language')} className="mt-lg">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {t('settings.languageSubtitle')}
            </p>
            <div className="lang-selector-grid">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  className={`lang-option-btn ${language === lang.code ? 'active' : ''}`}
                  onClick={() => handleLangChange(lang.code)}
                >
                  <span className="lang-flag">{lang.flag}</span>
                  <span className="lang-label">{lang.label}</span>
                  {language === lang.code && <span className="lang-check">✓</span>}
                </button>
              ))}
            </div>
            {langSaved && (
              <div className="lang-saved-msg">
                ✓ {t('settings.languageSaved')}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card title={t('settings.systemInfo')}>
            <div className="flex flex-col gap-md">
              <div className="flex justify-between items-center py-xs border-bottom border-subtle">
                <span className="text-xs text-muted uppercase tracking-wider">{t('settings.version')}</span>
                <span className="text-sm font-bold">v5.0.0-gold</span>
              </div>
              <div className="flex justify-between items-center py-xs border-bottom border-subtle">
                <span className="text-xs text-muted uppercase tracking-wider">{t('settings.environment')}</span>
                <span className="text-sm font-bold">{t('settings.production')}</span>
              </div>
              <div className="flex justify-between items-center py-xs">
                <span className="text-xs text-muted uppercase tracking-wider">{t('settings.license')}</span>
                <span className="text-sm font-bold">{t('settings.enterprise')}</span>
              </div>
              <Button variant="secondary" className="w-full mt-sm" size="sm">{t('settings.checkUpdates')}</Button>
            </div>
          </Card>

          <Card title={t('settings.quickActions')} className="mt-lg">
            <div className="flex flex-col gap-sm">
              <Button variant="secondary" className="w-full btn-sm" icon={<Download size={14} />}>{t('settings.exportData')}</Button>
              <Button variant="secondary" className="w-full btn-sm" icon={<RefreshCw size={14} />}>{t('settings.purgeCache')}</Button>
              <Button variant="danger" className="w-full btn-sm" icon={<Trash2 size={14} />}>{t('settings.factoryReset')}</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
