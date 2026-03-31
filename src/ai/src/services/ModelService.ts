import tf from '@tensorflow/tfjs-node';
import sharp from 'sharp';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ModelInput, ModelOutput, AnalysisFinding, BoundingBox } from '../types';

class ModelService {
  private models: Map<string, tf.LayersModel> = new Map();
  private loading: Map<string, Promise<void>> = new Map();

  async loadModel(modelId: string): Promise<void> {
    if (this.models.has(modelId)) {
      logger.debug(`Model ${modelId} already loaded`);
      return;
    }

    if (this.loading.has(modelId)) {
      logger.debug(`Model ${modelId} loading in progress`);
      return await this.loading.get(modelId);
    }

    const loadingPromise = this.loadModelInternal(modelId);
    this.loading.set(modelId, loadingPromise);

    try {
      await loadingPromise;
    } finally {
      this.loading.delete(modelId);
    }
  }

  private async loadModelInternal(modelId: string): Promise<void> {
    let modelPath: string;

    switch (modelId) {
      case 'lung-nodule-detector':
        modelPath = config.models.lungNoduleDetector.path;
        break;
      case 'chest-xray-classifier':
        modelPath = config.models.chestXrayClassifier.path;
        break;
      default:
        throw new Error(`Unsupported model: ${modelId}`);
    }

    logger.info(`Loading model ${modelId} from ${modelPath}`);

    try {
      // In a real implementation, load the model from disk or remote storage
      // For now, we'll create a dummy model for demonstration purposes
      const model = this.createDummyModel(modelId);
      this.models.set(modelId, model);
      logger.info(`Model ${modelId} loaded successfully`);
    } catch (err) {
      logger.error(`Failed to load model ${modelId}:`, err);
      throw err;
    }
  }

  private createDummyModel(modelId: string): tf.LayersModel {
    if (modelId === 'lung-nodule-detector') {
      const inputs = tf.input({ shape: [256, 256, 1] });
      const conv1 = tf.layers.conv2d({
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
      }).apply(inputs);
      const pool1 = tf.layers.maxPooling2d({ poolSize: 2 }).apply(conv1);
      const conv2 = tf.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
      }).apply(pool1);
      const pool2 = tf.layers.maxPooling2d({ poolSize: 2 }).apply(conv2);
      const flatten = tf.layers.flatten().apply(pool2);
      const dense1 = tf.layers.dense({ units: 128, activation: 'relu' }).apply(flatten);
      const outputs = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(dense1);

      return tf.model({ inputs, outputs });
    }

    const inputs = tf.input({ shape: [256, 256, 1] });
    const conv = tf.layers.conv2d({
      filters: 16,
      kernelSize: 3,
      activation: 'relu'
    }).apply(inputs);
    const pool = tf.layers.maxPooling2d({ poolSize: 2 }).apply(conv);
    const flatten = tf.layers.flatten().apply(pool);
    const dense = tf.layers.dense({ units: 64, activation: 'relu' }).apply(flatten);
    const outputs = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(dense);

    return tf.model({ inputs, outputs });
  }

  async predict(input: ModelInput): Promise<ModelOutput> {
    const startTime = Date.now();
    let visualizationData: Buffer | undefined;

    try {
      const image = await sharp(input.imageData)
        .resize({ width: 256, height: 256 })
        .grayscale()
        .toBuffer();

      const tensor = tf.browser.fromPixels({
        data: new Uint8Array(image),
        width: 256,
        height: 256
      }, 1)
        .toFloat()
        .div(255.0)
        .expandDims(0);

      if (input.parameters?.visualization) {
        visualizationData = await this.createVisualization(image);
      }

      const findings = this.generateDummyFindings();
      const inferenceTime = Date.now() - startTime;

      return {
        success: true,
        findings,
        confidenceScore: 0.85,
        inferenceTimeMs: inferenceTime,
        visualizationData,
        rawOutput: {
          version: '1.0.0',
          model: input.parameters?.model || 'default',
        },
      };
    } catch (err) {
      logger.error('Prediction error:', err);
      return {
        success: false,
        findings: [],
        confidenceScore: 0,
        inferenceTimeMs: Date.now() - startTime,
        rawOutput: { error: err instanceof Error ? err.message : 'Unknown error' },
      };
    }
  }

  private generateDummyFindings(): AnalysisFinding[] {
    const findings: AnalysisFinding[] = [];

    const noduleTypes = ['calcified', 'non-calcified', 'partially-calcified'];
    const bbox: BoundingBox = {
      x: Math.floor(Math.random() * 150),
      y: Math.floor(Math.random() * 150),
      width: Math.floor(Math.random() * 100) + 50,
      height: Math.floor(Math.random() * 100) + 50,
    };

    findings.push({
      type: noduleTypes[Math.floor(Math.random() * noduleTypes.length)],
      confidence: parseFloat((Math.random() * 0.4 + 0.6).toFixed(2)),
      bbox,
      volume: parseFloat((Math.random() * 3000 + 1000).toFixed(2)),
      description: 'Found suspicious nodule',
      metadata: {
        texture: 'smooth',
        border: 'well-defined',
      },
    });

    return findings;
  }

  private async createVisualization(imageData: Buffer): Promise<Buffer> {
    return sharp(imageData)
      .resize({ width: 256, height: 256 })
      .grayscale()
      .toBuffer();
  }

  async destroy(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (model) {
      model.dispose();
      this.models.delete(modelId);
      logger.info(`Model ${modelId} destroyed`);
    }
  }

  async destroyAll(): Promise<void> {
    for (const modelId of this.models.keys()) {
      await this.destroy(modelId);
    }
  }
}

export const modelService = new ModelService();
