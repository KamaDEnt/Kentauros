import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import Button from '../components/ui/Button';

const Login = () => {
  const [email, setEmail] = useState('admin@kentauros.consulting');
  const [password, setPassword] = useState('********');
  const { login } = useApp();
  const { t } = useI18n();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow" aria-hidden="true" />
      <div className="login-container animate-fade-in">
        <div className="login-header">
          <div className="login-logo" aria-hidden="true">K</div>
          <h1 className="login-title">KENTAUROS OS</h1>
          <p className="login-subtitle">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group mb-lg">
            <label className="input-label">{t('login.identity')}</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
            />
          </div>
          <div className="input-group mb-xl">
            <label className="input-label">{t('login.accessCode')}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {t('login.initialize')}
          </Button>
        </form>

        <div className="login-footer">
          <a href="#forgot">{t('login.forgotAccess')}</a>
          <span className="login-divider">|</span>
          <a href="#security">{t('login.securityProtocol')}</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
