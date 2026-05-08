import React, { useState } from 'react';
import { useMetrics } from '../context/MetricsContext';
import { useI18n } from '../context/I18nContext';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const Productivity = () => {
  const { t } = useI18n();
  const { productivityMetrics, generateAIProductivityAnalysis } = useMetrics();
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = () => {
    setAnalysis(generateAIProductivityAnalysis());
  };

  if (!productivityMetrics) return <div className="loader">Carregando métricas...</div>;

  return (
    <div className="productivity-page animate-fade-in">
      <PageHeader 
        title={t('nav.productivity') || 'Produtividade'}
        subtitle="Métricas de desempenho e análise de gargalos"
        actions={
          <Button variant="primary" onClick={runAnalysis}>
            Analisar com IA
          </Button>
        }
      />

      {analysis && (
        <div className="mb-8">
          <Card title="Análise da IA (Kentauros Insight)" className="border-l-4 border-l-[var(--k-gold-500)]">
            <div className="grid grid-2 gap-4">
              <div>
                <h4 className="font-bold mb-2 text-sm text-muted uppercase">Resumo</h4>
                <p>{analysis.summary}</p>
              </div>
              <div>
                <h4 className="font-bold mb-2 text-sm text-muted uppercase">Gargalos</h4>
                <p className="text-[var(--k-red-500)]">{analysis.bottlenecks}</p>
              </div>
              <div>
                <h4 className="font-bold mb-2 text-sm text-muted uppercase">Riscos</h4>
                <p className="text-[var(--k-yellow-500)]">{analysis.risks}</p>
              </div>
              <div>
                <h4 className="font-bold mb-2 text-sm text-muted uppercase">Sugestões</h4>
                <p className="text-[var(--k-blue-500)]">{analysis.suggestions}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-4 mb-8">
        <StatCard label="Throughput (Cards/Dia)" value={productivityMetrics.team.throughput} trend="up" change="+2" />
        <StatCard label="WIP (Work In Progress)" value={productivityMetrics.team.wip} trend="down" change="-1" />
        <StatCard label="Cycle Time (Dias)" value={productivityMetrics.team.cycleTime} trend="up" change="-15%" />
        <StatCard label="Bloqueados" value={productivityMetrics.team.blocked} />
      </div>

      <Card title="Desempenho por Funcionário">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Concluídos</th>
                <th>Em Andamento</th>
                <th>Atrasados</th>
                <th>Capacidade</th>
                <th>Taxa de Retrabalho</th>
              </tr>
            </thead>
            <tbody>
              {productivityMetrics.employees.map(emp => (
                <tr key={emp.id}>
                  <td className="font-bold">{emp.name}</td>
                  <td>{emp.completed}</td>
                  <td>{emp.ongoing}</td>
                  <td>
                    {emp.delayed > 0 ? (
                      <Badge variant="danger">{emp.delayed}</Badge>
                    ) : (
                      <Badge variant="success">0</Badge>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-surface rounded-full h-2">
                        <div 
                          className="bg-[var(--k-gold-500)] h-2 rounded-full" 
                          style={{ width: emp.capacity }}
                        ></div>
                      </div>
                      <span className="text-xs">{emp.capacity}</span>
                    </div>
                  </td>
                  <td>{emp.reworkRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Productivity;
