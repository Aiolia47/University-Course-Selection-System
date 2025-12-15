export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  url?: string;
  testUrl?: string;
  synchronize: boolean;
  connectionLimit: number;
  acquireTimeout: number;
  connectTimeout: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface CorsConfig {
  origin: string | string[];
  credentials?: boolean;
}

export interface UploadConfig {
  maxSize: number;
  allowedTypes: string[];
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
}

export interface RedisConfig {
  url: string;
}

export interface LogConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
}

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  apiHost: string;
  apiPort: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  cors: CorsConfig;
  upload: UploadConfig;
  log: LogConfig;
  redis?: RedisConfig;
  smtp?: SmtpConfig;
  google?: GoogleConfig;
  sentryDsn?: string;
}

export interface ReactAppConfig {
  apiUrl: string;
  environment: 'development' | 'production' | 'test';
}