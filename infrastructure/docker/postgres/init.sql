-- Create initial database schema for BMAD7
-- This file is executed when the PostgreSQL container starts for the first time

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types if needed
-- Example: CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

-- Log initialization
\echo 'BMAD7 database initialized successfully'