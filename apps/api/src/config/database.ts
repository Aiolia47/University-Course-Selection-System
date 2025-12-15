import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Selection } from '../models/Selection';
import { Permission } from '../models/Permission';
import { RolePermission } from '../models/RolePermission';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../utils/logger';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bmad7_course_selection',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Course, Selection, Permission, RolePermission, AuditLog],
  migrations: ['src/migrations/*.ts'],
  seeds: ['src/seeds/*.ts'],
  charset: 'utf8mb4',
  timezone: '+08:00',
  acquireTimeout: 60000,
  connectionLimit: 10,
  connectTimeout: 60000,
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connection established successfully');
    }
  } catch (error) {
    logger.error('Error during database initialization:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed successfully');
    }
  } catch (error) {
    logger.error('Error during database closure:', error);
    throw error;
  }
};