import React from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../context/I18nContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Users as UsersIcon } from 'lucide-react';

const Clients = () => {
  const { leads, clients: registeredClients, projects } = useData();
  const { t } = useI18n();

  const clientsFromLeads = leads.filter(l => l.status === 'won').map(l => ({
    id: l.id,
    name: l.company,
    industry: l.industry,
    projects: projects.filter(p => p.client === l.company),
    contact: l.contact || l.contactName,
    email: l.email || l.contactEmail
  }));

  const clients = [
    ...registeredClients.map(client => ({
      id: `client-${client.id}`,
      name: client.name,
      industry: client.segment || client.industry,
      projects: projects.filter(p => p.clientId === client.id || p.client === client.name),
      contact: client.contact,
      email: client.email,
    })),
    ...clientsFromLeads,
  ].filter((client, index, list) => list.findIndex(item => item.name === client.name) === index);

  return (
    <div className="clients-page animate-fade-in">
      <PageHeader 
        title={t('clients.title')} 
        subtitle={t('clients.subtitle')}
        actions={<Button variant="primary">{t('clients.registerNew')}</Button>}
      />

      <div className="grid grid-3">
        {clients.map(client => (
          <Card 
            key={client.id}
            title={client.name}
            footer={<Button variant="secondary" size="sm" className="w-full">{t('clients.viewHistory')}</Button>}
          >
            <div className="mb-4">
              <div className="text-xs text-muted">{t('common.industry')}</div>
              <div className="text-sm">{client.industry}</div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-muted">{t('clients.activeProjects')}</div>
              <div className="flex gap-2 flex-wrap mt-2">
                {client.projects.length > 0 ? client.projects.map(p => (
                  <Badge key={p.id} variant="blue">{p.name}</Badge>
                )) : <span className="text-xs text-muted italic">{t('clients.noActiveProjects')}</span>}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-xs text-muted">{t('clients.primaryContact')}</div>
              <div className="text-sm font-bold">{client.contact}</div>
              <div className="text-xs text-muted">{client.email}</div>
            </div>
          </Card>
        ))}
        {clients.length === 0 && (
          <div className="col-span-3">
            <EmptyState 
              icon={UsersIcon}
              title={t('clients.emptyState')}
              description={t('clients.noClientsDesc', 'No won leads found to be listed as clients.')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
