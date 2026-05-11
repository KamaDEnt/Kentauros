import { aiService } from '../ai/aiService';

export const CI_CD_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const DEPLOYMENT_ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
};

class CICDService {
  constructor() {
    this.deployments = [];
    this.pipelines = [];
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  notify(event, data) {
    this.subscribers.forEach(s => s({ event, data, timestamp: new Date().toISOString() }));
  }

  log(level, message, context = {}) {
    aiService.addLog('CI/CD', message, level);
    this.notify('log', { level, message, ...context });
  }

  async createDeployment(projectId, config = {}) {
    this.log('info', `Criando deployment para projeto ${projectId}`);

    const deployment = {
      id: `deploy-${Date.now()}`,
      projectId,
      projectName: config.projectName || `Project ${projectId}`,
      environment: config.environment || DEPLOYMENT_ENVIRONMENTS.STAGING,
      status: CI_CD_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      url: null,
      commit: config.commit || this.generateCommitHash(),
      branch: config.branch || 'main',
      pipeline: null,
      logs: [],
    };

    this.deployments.push(deployment);
    this.log('success', `Deployment ${deployment.id} criado`);
    this.notify('deployment_created', { deployment });

    return deployment;
  }

  generateCommitHash() {
    return Math.random().toString(36).substring(2, 9);
  }

  async runPipeline(deploymentId) {
    const deployment = this.deployments.find(d => d.id === deploymentId);
    if (!deployment) {
      throw new Error('Deployment não encontrado');
    }

    this.log('info', `Iniciando pipeline para ${deployment.projectName}`);

    deployment.status = CI_CD_STATUS.RUNNING;
    deployment.startedAt = new Date().toISOString();

    const stages = [
      { name: 'Install Dependencies', duration: 30 },
      { name: 'Run Linting', duration: 20 },
      { name: 'Run Tests', duration: 60 },
      { name: 'Build', duration: 45 },
      { name: 'Deploy', duration: 25 },
    ];

    const pipeline = {
      id: `pipeline-${Date.now()}`,
      deploymentId,
      stages: [],
      status: CI_CD_STATUS.RUNNING,
    };

    for (const stage of stages) {
      this.log('info', `Executando stage: ${stage.name}`);

      await new Promise(resolve => setTimeout(resolve, stage.duration * 100));

      const stageResult = {
        name: stage.name,
        status: Math.random() > 0.1 ? CI_CD_STATUS.SUCCESS : CI_CD_STATUS.FAILED,
        duration: stage.duration,
        logs: this.generateStageLogs(stage.name),
      };

      pipeline.stages.push(stageResult);
      deployment.logs.push({ stage: stage.name, status: stageResult.status, timestamp: new Date().toISOString() });

      if (stageResult.status === CI_CD_STATUS.FAILED) {
        pipeline.status = CI_CD_STATUS.FAILED;
        deployment.status = CI_CD_STATUS.FAILED;
        deployment.completedAt = new Date().toISOString();
        this.log('error', `Stage ${stage.name} falhou`);
        break;
      }
    }

    if (pipeline.status !== CI_CD_STATUS.FAILED) {
      pipeline.status = CI_CD_STATUS.SUCCESS;
      deployment.status = CI_CD_STATUS.SUCCESS;
      deployment.completedAt = new Date().toISOString();
      deployment.url = this.generateDeployUrl(deployment);
      this.log('success', `Pipeline concluído com sucesso`);
    }

    deployment.pipeline = pipeline;
    this.pipelines.push(pipeline);
    this.notify('pipeline_completed', { deployment, pipeline });

    return deployment;
  }

  generateStageLogs(stageName) {
    const logs = {
      'Install Dependencies': [
        'npm WARN deprecated package@1.0.0',
        'added 1256 packages in 8.2s',
        'Running audit...',
        'found 0 vulnerabilities',
      ],
      'Run Linting': [
        'linting files...',
        'src/App.tsx - 0 errors',
        'src/pages/*.tsx - 0 warnings',
        'linting passed',
      ],
      'Run Tests': [
        'Running test suite...',
        ' PASS  src/__tests__/App.test.tsx',
        ' PASS  src/__tests__/components/*.test.tsx',
        'Test Suites: 12 passed, 12 total',
        'Tests: 45 passed, 45 total',
      ],
      'Build': [
        'vite v8.0.10 building for production...',
        'transforming...✓ 2427 modules transformed.',
        'dist/index.html                   0.91 kB │ gzip:   0.48 kB',
        '✓ built in 2.34s',
      ],
      'Deploy': [
        'Uploading build artifacts...',
        'Deploying to Vercel...',
        'Deployment complete!',
      ],
    };

    return logs[stageName] || [`${stageName} completed`];
  }

  generateDeployUrl(deployment) {
    const slug = deployment.projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const env = deployment.environment === 'production' ? '' : `-${deployment.environment}`;
    return `https://${slug}${env}.vercel.app`;
  }

  async rollback(deploymentId) {
    const deployment = this.deployments.find(d => d.id === deploymentId);
    if (!deployment) {
      throw new Error('Deployment não encontrado');
    }

    this.log('warning', `Rollback solicitado para ${deployment.projectName}`);

    const previousDeployment = this.deployments
      .filter(d => d.projectId === deployment.projectId && d.status === CI_CD_STATUS.SUCCESS && d.id !== deploymentId)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];

    if (!previousDeployment) {
      this.log('error', 'Nenhum deployment anterior encontrado para rollback');
      return null;
    }

    const rollbackDeployment = await this.createDeployment(deployment.projectId, {
      projectName: deployment.projectName,
      environment: deployment.environment,
      commit: previousDeployment.commit,
      branch: previousDeployment.branch,
    });

    rollbackDeployment.isRollback = true;
    rollbackDeployment.rollbackFrom = deployment.id;

    this.notify('rollback_started', { deployment: rollbackDeployment, from: deployment });

    return rollbackDeployment;
  }

  async triggerWebhook(projectId, event, payload = {}) {
    this.log('info', `Triggering webhook: ${event}`);

    const webhookPayload = {
      event,
      projectId,
      timestamp: new Date().toISOString(),
      payload,
    };

    this.notify('webhook_triggered', webhookPayload);

    await new Promise(resolve => setTimeout(resolve, 500));

    this.log('success', `Webhook ${event} executado`);

    return { success: true, webhookPayload };
  }

  getDeploymentsByProject(projectId) {
    return this.deployments
      .filter(d => d.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getLatestDeployment(projectId, environment = null) {
    const filtered = this.deployments.filter(d =>
      d.projectId === projectId &&
      (!environment || d.environment === environment)
    );

    if (!filtered.length) return null;

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }

  getPipelineStatus(deploymentId) {
    const deployment = this.deployments.find(d => d.id === deploymentId);
    return deployment?.pipeline || null;
  }

  generateDeployReport(projectId) {
    const deployments = this.getDeploymentsByProject(projectId);

    return {
      projectId,
      totalDeployments: deployments.length,
      successful: deployments.filter(d => d.status === CI_CD_STATUS.SUCCESS).length,
      failed: deployments.filter(d => d.status === CI_CD_STATUS.FAILED).length,
      pending: deployments.filter(d => d.status === CI_CD_STATUS.PENDING || d.status === CI_CD_STATUS.RUNNING).length,
      successRate: deployments.length > 0
        ? Math.round((deployments.filter(d => d.status === CI_CD_STATUS.SUCCESS).length / deployments.length) * 100)
        : 0,
      avgDuration: this.calculateAvgDuration(deployments),
      environments: this.getEnvironmentsByProject(projectId),
      generatedAt: new Date().toISOString(),
    };
  }

  calculateAvgDuration(deployments) {
    const completed = deployments.filter(d => d.completedAt && d.startedAt);
    if (!completed.length) return 0;

    const totalDuration = completed.reduce((sum, d) => {
      return sum + (new Date(d.completedAt) - new Date(d.startedAt)) / 1000;
    }, 0);

    return Math.round(totalDuration / completed.length);
  }

  getEnvironmentsByProject(projectId) {
    const envs = {};
    this.deployments
      .filter(d => d.projectId === projectId)
      .forEach(d => {
        if (!envs[d.environment] || new Date(d.createdAt) > new Date(envs[d.environment].lastDeploy)) {
          envs[d.environment] = {
            environment: d.environment,
            lastDeploy: d.createdAt,
            status: d.status,
            url: d.url,
          };
        }
      });

    return Object.values(envs);
  }
}

export const cicdService = new CICDService();