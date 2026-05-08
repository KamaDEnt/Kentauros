import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';
import { mockUsers } from '../data/mock-users';

const MetricsContext = createContext();

export const MetricsProvider = ({ children }) => {
  const { backlog, projects } = useData();
  const [productivityMetrics, setProductivityMetrics] = useState(null);

  useEffect(() => {
    // Generate derived metrics from backlog and projects
    if (!backlog || !projects) return;

    const completedCards = backlog.filter(b => b.status === 'done').length;
    const ongoingCards = backlog.filter(b => ['in-progress', 'in_progress', 'review'].includes(b.status)).length;
    const blockedCards = backlog.filter(b => b.status === 'blocked').length;
    
    const teamMetrics = {
      throughput: Math.round(completedCards / 7) || 0, // Mock: cards per day in the last week
      wip: ongoingCards,
      blocked: blockedCards,
      leadTime: 5.2, // Mock average days
      cycleTime: 2.8 // Mock average days
    };

    const employeeMetrics = mockUsers
      .filter(user => ['DEV', 'QA', 'UX', 'DEVOPS'].some(tag => (user.tags || []).includes(tag)))
      .map(user => {
        const userTasks = backlog.filter(task => task.assignee === user.id || task.assigneeEmail === user.email);
        const completed = userTasks.filter(task => task.status === 'done').length;
        const ongoing = userTasks.filter(task => ['in_progress', 'review'].includes(task.status)).length;
        const delayed = userTasks.filter(task => task.status === 'blocked').length;
        const total = Math.max(userTasks.length, 1);
        return {
          id: user.id,
          name: user.name,
          completed,
          ongoing,
          delayed,
          reworkRate: `${Math.round((userTasks.filter(task => task.qaApproval === 'rejected').length / total) * 100)}%`,
          capacity: `${Math.min(100, Math.round(((ongoing + delayed) / 6) * 100))}%`,
        };
      });

    setProductivityMetrics({
      team: teamMetrics,
      employees: employeeMetrics,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length
    });
  }, [backlog, projects]);

  const generateAIProductivityAnalysis = () => {
    return {
      summary: "A produtividade geral está estável. O tempo de ciclo (Cycle Time) melhorou 15% em relação à semana passada.",
      bottlenecks: "A etapa de QA está acumulando cards (WIP alto).",
      risks: "Marcos Dev está próximo do limite de capacidade (80%), com risco de atraso nas próximas sprints se assumir novos cards críticos.",
      suggestions: "Redistribuir 2 cards de baixa prioridade de Marcos para outro desenvolvedor. Avaliar alocação temporária de suporte em QA para reduzir o gargalo."
    };
  };

  return (
    <MetricsContext.Provider value={{ productivityMetrics, generateAIProductivityAnalysis }}>
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetrics = () => useContext(MetricsContext);
