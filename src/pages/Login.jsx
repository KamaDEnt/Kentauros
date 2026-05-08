import React, { useState } from 'react';
import { LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Login = () => {
  const [email, setEmail] = useState('admin@kentauros.consulting');
  const [password, setPassword] = useState('kentauros-admin');
  const [error, setError] = useState('');
  const { login } = useApp();
  const { t } = useI18n();

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const ok = login({ email, password });
    if (!ok) setError('Credenciais não encontradas para este ambiente.');
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow" aria-hidden="true" />

      <section className="login-shell animate-fade-in">
        <div className="login-hero">
          <div className="login-brand-row">
            <div className="login-logo" aria-hidden="true">K</div>
            <span>Kentauros OS</span>
          </div>

          <div className="login-copy">
            <p className="login-kicker">Consultoria digital automatizada</p>
            <h1 className="login-title">Acesse o ecossistema operacional</h1>
            <p className="login-subtitle">{t('login.subtitle')}</p>
          </div>

          <div className="login-signal-grid" aria-hidden="true">
            <div><ShieldCheck size={18} /><span>Admin</span></div>
            <div><Sparkles size={18} /><span>SDD</span></div>
            <div><LockKeyhole size={18} /><span>Tenant</span></div>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-panel-header">
            <span className="login-panel-eyebrow">Acesso seguro</span>
            <h2>Inicializar sessão</h2>
            <p>Use uma conta admin cadastrada para configurar o ambiente e publicar no Vercel.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <Input
              id="login-email"
              label={t('login.identity')}
              type="email"
              icon={Mail}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              required
            />

            <Input
              id="login-password"
              label={t('login.accessCode')}
              type="password"
              icon={LockKeyhole}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Código de acesso"
              autoComplete="current-password"
              required
            />

            {error && <div className="login-error">{error}</div>}

            <Button type="submit" variant="primary" size="lg" className="w-full">
              {t('login.initialize')}
            </Button>
          </form>

          <div className="login-admin-hint">
            <span>Admin inicial</span>
            <strong>admin@kentauros.consulting</strong>
          </div>

          <div className="login-footer">
            <a href="#forgot">{t('login.forgotAccess')}</a>
            <span className="login-divider">|</span>
            <a href="#security">{t('login.securityProtocol')}</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
