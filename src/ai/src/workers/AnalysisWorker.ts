import { logger } from '../utils/logger';
import { messageQueueService, modelService, storageService } from '../services';
import { resultRepository } from '../repositories/ResultRepository';
import { AnalysisTask, AnalysisFinding, AnalysisResult } from '../types';

export class AnalysisWorker {
  private isRunning = false;
  private modelId: string;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker is already running');
      return;
    }

    try {
      logger.info(`Starting Analysis Worker for model: ${this.modelId}`);

      await modelService.loadModel(this.modelId);
      await messageQueueService.connect();

      this.isRunning = true;

      await messageQueueService.consumeTasks(this.processTask.bind(this));
    } catch (err) {
      logger.error('Failed to start worker:', err);
      this.isRunning = false;
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping Analysis Worker...');
    this.isRunning = false;

    try {
      await messageQueueService.close();
      await modelService.destroy(this.modelId);
    } catch (err) {
      logger.error('Error stopping worker:', err);
    }
  }

  private async processTask(task: AnalysisTask): Promise<void> {
    const startTime = Date.now();
    logger.info(`Processing task ${task.id} for study ${task.studyId}`);

    try {
      await storageService.bucketExists();

      const imageKey = `studies/${task.studyId}/primary.dcm`;
      const imageData = await storageService.getObject(imageKey);

      const modelInput = {
        imageData,
        imageSize: {
          width: 256,
          height: 256,
          channels: 1,
        },
        parameters: {
          ...task.parameters,
          model: this.modelId,
          visualization: true,
        },
      };

      const modelOutput = await modelService.predict(modelInput);

      if (!modelOutput.success) {
        throw new Error(typeof modelOutput.rawOutput?.error === 'string' ? modelOutput.rawOutput.error : 'Model prediction failed');
      }

      const visualizationKey = `results/${task.id}/visualization.png`;
      let visualizationUrl: string | undefined;

      if (modelOutput.visualizationData) {
        await storageService.putObject(
          visualizationKey,
          modelOutput.visualizationData,
          'image/png'
        );
        visualizationUrl = await storageService.getObjectUrl(visualizationKey);
      }

      const resultData: AnalysisResult = {
        taskId: task.id,
        modelId: this.modelId,
        modelVersion: task.modelVersion,
        findings: modelOutput.findings,
        visualizationUrl,
        reportText: this.generateReport(modelOutput.findings),
        metrics: {
          inferenceTimeMs: modelOutput.inferenceTimeMs,
          totalFindings: modelOutput.findings.length,
          confidenceScore: modelOutput.confidenceScore,
        },
        rawOutput: modelOutput.rawOutput,
        createdAt: new Date(),
      };

      await resultRepository.create(resultData);
      await messageQueueService.publishResult(task.id, resultData);

      const totalTime = Date.now() - startTime;
      logger.info(
        { taskId: task.id, inferenceTime: modelOutput.inferenceTimeMs, totalTime },
        'Task processed successfully'
      );
    } catch (err) {
      logger.error({ taskId: task.id, error: err }, 'Task processing failed');
      throw err;
    }
  }

  private generateReport(findings: AnalysisFinding[]): string {
    if (findings.length === 0) {
      return 'No significant findings detected.';
    }

    const reportParts = [`Analysis Findings (${findings.length} total):\n`];

    findings.forEach((finding, index) => {
      reportParts.push(
        `${index + 1}. ${finding.type}`,
        `   Confidence: ${(finding.confidence * 100).toFixed(1)}%`,
        finding.description ? `   ${finding.description}` : ''
      );

      if (finding.bbox) {
        reportParts.push(
          `   Location: x=${finding.bbox.x}, y=${finding.bbox.y}, w=${finding.bbox.width}, h=${finding.bbox.height}`
        );
      }

      if (finding.volume) {
        reportParts.push(`   Estimated volume: ${finding.volume.toFixed(2)} mm³`);
      }

      reportParts.push('');
    });

    return reportParts.join('\n');
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
