import React from 'react';
import CEODashboard from '../components/ceo/CEODashboard';
import { useData } from '../context/DataContext';
import { useParams } from 'react-router-dom';

const CEO = () => {
  const { projects } = useData();
  const { projectId } = useParams();

  const project = projectId ? projects.find(p => p.id === projectId) : null;

  return <CEODashboard projectId={projectId} project={project} />;
};

export default CEO;