import { Client } from 'minio';
import { config } from '../config';
import { logger } from '../utils/logger';

class StorageService {
  private client: Client;

  constructor() {
    this.client = new Client({
      endPoint: config.storage.minio.endPoint,
      port: config.storage.minio.port,
      useSSL: config.storage.minio.useSSL,
      accessKey: config.storage.minio.accessKey,
      secretKey: config.storage.minio.secretKey,
    });
  }

  async bucketExists(): Promise<boolean> {
    return this.client.bucketExists(config.storage.minio.bucket);
  }

  async createBucket(): Promise<void> {
    const exists = await this.bucketExists();
    if (!exists) {
      await this.client.makeBucket(config.storage.minio.bucket);
      logger.info(`Bucket ${config.storage.minio.bucket} created`);
    }
  }

  async getObject(key: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.client.getObject(config.storage.minio.bucket, key, (err, dataStream) => {
        if (err) {
          reject(err);
          return;
        }

        dataStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        dataStream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        dataStream.on('error', (err) => {
          reject(err);
        });
      });
    });
  }

  async putObject(key: string, data: Buffer, contentType?: string): Promise<string> {
    await this.client.putObject(config.storage.minio.bucket, key, data, {
      'Content-Type': contentType || 'application/octet-stream',
    });
    return key;
  }

  async removeObject(key: string): Promise<void> {
    await this.client.removeObject(config.storage.minio.bucket, key);
  }

  async getObjectUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(
      config.storage.minio.bucket,
      key,
      expiresInSeconds
    );
  }

  async getUploadUrl(key: string, expiresInSeconds = 3600): Promise<{
    url: string;
    method: 'PUT' | 'POST';
    headers?: Record<string, string>;
  }> {
    const url = await this.client.presignedPutObject(
      config.storage.minio.bucket,
      key,
      expiresInSeconds
    );
    return {
      url,
      method: 'PUT',
    };
  }

  async listObjects(prefix?: string): Promise<string[]> {
    const objects: string[] = [];
    const stream = this.client.listObjectsV2(config.storage.minio.bucket, prefix);

    for await (const obj of stream) {
      objects.push(obj.name);
    }

    return objects;
  }
}

export const storageService = new StorageService();
