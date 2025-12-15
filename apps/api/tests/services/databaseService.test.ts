import { DatabaseService } from '../../src/services/databaseService';
import { initializeTestDatabase, closeTestDatabase, clearTestDatabase } from '../testDatabase';

describe('DatabaseService', () => {
  let databaseService: DatabaseService;

  beforeAll(async () => {
    databaseService = DatabaseService.getInstance();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Database Operations', () => {
    it('should initialize database connection', async () => {
      await expect(databaseService.initialize()).resolves.not.toThrow();
      expect(databaseService.getDataSource().isInitialized).toBe(true);
    });

    it('should handle health check', async () => {
      await databaseService.initialize();

      const health = await databaseService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.connected).toBe(true);
      expect(health.details).toBeDefined();
      expect(health.details.database).toBeDefined();
      expect(health.details.type).toBe('mysql');
    });

    it('should handle transaction successfully', async () => {
      await databaseService.initialize();

      const result = await databaseService.transaction(async (manager) => {
        // Test query within transaction
        const queryResult = await manager.query('SELECT 1 as test');
        return queryResult[0].test;
      });

      expect(result).toBe(1);
    });

    it('should handle transaction rollback on error', async () => {
      await databaseService.initialize();

      await expect(
        databaseService.transaction(async (manager) => {
          // This will cause an error
          throw new Error('Transaction test error');
        })
      ).rejects.toThrow('Transaction test error');
    });

    it('should close database connection', async () => {
      await databaseService.initialize();
      expect(databaseService.getDataSource().isInitialized).toBe(true);

      await expect(databaseService.close()).resolves.not.toThrow();
      // Note: In test environment, we may need to reinitialize for other tests
    });
  });

  describe('Error Handling', () => {
    it('should handle health check when not initialized', async () => {
      // Force close the connection for testing
      await databaseService.close();

      const health = await databaseService.healthCheck();

      expect(health.status).toBe('disconnected');
      expect(health.connected).toBe(false);
      expect(health.details.message).toBe('Database not initialized');
    });

    it('should handle invalid health check query', async () => {
      await databaseService.initialize();

      // Mock the query to simulate an error
      const originalQuery = databaseService.getDataSource().query;
      databaseService.getDataSource().query = jest.fn().mockRejectedValue(new Error('Query failed'));

      const health = await databaseService.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.connected).toBe(false);

      // Restore original query method
      databaseService.getDataSource().query = originalQuery;
    });
  });
});