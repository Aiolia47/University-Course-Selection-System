import { DataSource } from 'typeorm';
import { User } from '../src/models/User';
import { Course } from '../src/models/Course';
import { Selection } from '../src/models/Selection';
import { Permission } from '../src/models/Permission';
import { RolePermission } from '../src/models/RolePermission';
import { AuditLog } from '../src/models/AuditLog';

export const testDataSource = new DataSource({
  type: 'mysql',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '3306'),
  username: process.env.TEST_DB_USER || 'root',
  password: process.env.TEST_DB_PASSWORD || '',
  database: process.env.TEST_DB_NAME || 'bmad7_course_selection_test',
  synchronize: true,
  logging: false,
  entities: [User, Course, Selection, Permission, RolePermission, AuditLog],
  migrations: [],
  seeds: [],
  charset: 'utf8mb4',
  timezone: '+08:00',
  dropSchema: true,
});

export const initializeTestDatabase = async (): Promise<void> => {
  try {
    if (!testDataSource.isInitialized) {
      await testDataSource.initialize();
    }
  } catch (error) {
    console.error('Error during test database initialization:', error);
    throw error;
  }
};

export const closeTestDatabase = async (): Promise<void> => {
  try {
    if (testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
  } catch (error) {
    console.error('Error during test database closure:', error);
    throw error;
  }
};

export const clearTestDatabase = async (): Promise<void> => {
  const entities = testDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = testDataSource.getRepository(entity.name);
    await repository.clear();
  }
};