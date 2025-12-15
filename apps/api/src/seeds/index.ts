import { DataSource } from 'typeorm';
import { AppDataSource } from '../config/database';
import { BaseSeed } from './base';

async function runSeeds(): Promise<void> {
  try {
    console.log('Initializing database connection...');
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Running seeds...');
    const baseSeed = new BaseSeed(AppDataSource);
    await baseSeed.run();

    console.log('Seeds completed successfully!');
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run seeds if this file is executed directly
if (require.main === module) {
  runSeeds();
}

export { runSeeds };