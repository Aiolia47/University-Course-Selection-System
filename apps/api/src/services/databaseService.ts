import { AppDataSource } from '../config/database';
import { DataSource } from 'typeorm';

export class DatabaseService {
  private static instance: DatabaseService;
  private dataSource: DataSource;

  private constructor() {
    this.dataSource = AppDataSource;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
        console.log('Database connection established successfully');
      }
    } catch (error) {
      console.error('Error during database initialization:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        console.log('Database connection closed successfully');
      }
    } catch (error) {
      console.error('Error during database closure:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<{ status: string; connected: boolean; details?: any }> {
    try {
      if (!this.dataSource.isInitialized) {
        return {
          status: 'disconnected',
          connected: false,
          details: { message: 'Database not initialized' }
        };
      }

      const queryResult = await this.dataSource.query('SELECT 1 as health_check');

      return {
        status: 'healthy',
        connected: true,
        details: {
          database: this.dataSource.options.database,
          type: this.dataSource.options.type,
          host: this.dataSource.options.host,
          port: this.dataSource.options.port,
          queryResult: queryResult
        }
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        connected: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  public getDataSource(): DataSource {
    return this.dataSource;
  }

  public async transaction<T>(operation: (manager: DataSource) => Promise<T>): Promise<T> {
    if (!this.dataSource.isInitialized) {
      await this.initialize();
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner.manager as any);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}