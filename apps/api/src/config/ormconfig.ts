import { DataSourceOptions } from 'typeorm';
import { AppDataSource } from './database';

export const migrationOptions: DataSourceOptions = {
  ...AppDataSource.options,
  migrations: ['src/migrations/*.ts'],
  seeds: ['src/seeds/*.ts'],
  factories: ['src/factories/*.ts'],
};