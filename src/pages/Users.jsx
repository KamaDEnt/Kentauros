import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { mockUsers, ROLES } from '../data/mock-users';

const Users = () => {
  const users = mockUsers.map(user => ({
    ...user,
    status: user.status === 'active' ? 'online' : 'offline',
    lastActive: user.status === 'active' ? 'Agora' : 'indisponivel',
  }));

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'var(--success)';
      case 'away': return 'var(--warning)';
      case 'offline': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="users-page animate-fade-in">
      <PageHeader 
        title="Usuários"
        subtitle="Controle de acesso por perfil, tags e vínculo operacional."
        actions={<Button variant="primary">Convidar usuário</Button>}
      />

      <Card title="Equipe cadastrada">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Última atividade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info flex items-center gap-3">
                      <Avatar name={user.name} size="sm" />
                      <div className="font-bold">{user.name}</div>
                    </div>
                  </td>
                  <td>
                    <Badge variant="secondary">{ROLES[user.role]?.label || user.role}</Badge>
                  </td>
                  <td>
                    <div className="flex gap-xs flex-wrap">
                      {(user.tags || [user.role]).map(tag => <Badge key={tag} variant="accent">{tag}</Badge>)}
                    </div>
                  </td>
                  <td>
                    <div className="status-indicator flex items-center gap-2">
                      <span className="status-dot" style={{ background: getStatusColor(user.status), boxShadow: `0 0 8px ${getStatusColor(user.status)}` }}></span>
                      <span className="text-sm font-medium">{user.status.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="text-sm text-muted">{user.lastActive}</td>
                  <td>
                    <Button variant="secondary" size="sm">Permissões</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Users;
