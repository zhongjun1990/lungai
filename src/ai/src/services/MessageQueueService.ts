import amqp from 'amqplib';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AnalysisTask } from '../types';

class MessageQueueService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      logger.info('Connecting to RabbitMQ...');
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(
        config.rabbitmq.exchange,
        'direct',
        { durable: true }
      );

      await this.channel.assertQueue(
        config.rabbitmq.taskQueue,
        { durable: true }
      );

      await this.channel.assertQueue(
        config.rabbitmq.resultQueue,
        { durable: true }
      );

      await this.channel.bindQueue(
        config.rabbitmq.taskQueue,
        config.rabbitmq.exchange,
        'task'
      );

      await this.channel.bindQueue(
        config.rabbitmq.resultQueue,
        config.rabbitmq.exchange,
        'result'
      );

      this.isConnected = true;
      logger.info('RabbitMQ connected successfully');

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        this.reconnect();
      });

      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });
    } catch (err) {
      logger.error('Failed to connect to RabbitMQ:', err);
      this.isConnected = false;
      setTimeout(() => this.reconnect(), 5000);
      throw err;
    }
  }

  private async reconnect(): Promise<void> {
    logger.info('Attempting to reconnect to RabbitMQ...');
    try {
      await this.connect();
    } catch (err) {
      logger.error('Reconnection failed, retrying in 5 seconds');
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  async publishTask(task: AnalysisTask): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    const message = JSON.stringify(task);
    const sent = this.channel.publish(
      config.rabbitmq.exchange,
      'task',
      Buffer.from(message),
      { persistent: true }
    );

    if (sent) {
      logger.debug('Task published successfully:', task.id);
    } else {
      logger.warn('Failed to publish task:', task.id);
      throw new Error('Failed to publish task to RabbitMQ');
    }
  }

  async publishResult(taskId: string, result: any): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    const message = JSON.stringify({
      taskId,
      result,
      timestamp: new Date().toISOString(),
    });

    const sent = this.channel.publish(
      config.rabbitmq.exchange,
      'result',
      Buffer.from(message),
      { persistent: true }
    );

    if (sent) {
      logger.debug('Result published successfully:', taskId);
    } else {
      logger.warn('Failed to publish result:', taskId);
      throw new Error('Failed to publish result to RabbitMQ');
    }
  }

  async consumeTasks(callback: (task: AnalysisTask) => Promise<void>): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    await this.channel.consume(config.rabbitmq.taskQueue, async (msg) => {
      if (msg) {
        try {
          const task: AnalysisTask = JSON.parse(msg.content.toString());
          logger.debug('Processing task:', task.id);
          await callback(task);
          this.channel?.ack(msg);
        } catch (err) {
          logger.error('Error processing task:', err);
          this.channel?.nack(msg, false, true);
        }
      }
    });

    logger.info('Waiting for tasks...');
  }

  async consumeResults(callback: (taskId: string, result: any) => Promise<void>): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    await this.channel.consume(config.rabbitmq.resultQueue, async (msg) => {
      if (msg) {
        try {
          const { taskId, result } = JSON.parse(msg.content.toString());
          logger.debug('Received result for task:', taskId);
          await callback(taskId, result);
          this.channel?.ack(msg);
        } catch (err) {
          logger.error('Error processing result:', err);
          this.channel?.nack(msg, false, true);
        }
      }
    });

    logger.info('Waiting for results...');
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.isConnected = false;
    logger.info('RabbitMQ connection closed');
  }
}

export const messageQueueService = new MessageQueueService();
