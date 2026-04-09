import { Database } from "bun:sqlite";

const db = new Database("auth.db");

// User table
db.run(`
  CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    emailVerified TIMESTAMP,
    image TEXT,
    role TEXT DEFAULT 'user',
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
  )
`);

// Session table
db.run(`
  CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    expiresAt TIMESTAMP NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL,
    FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
  )
`);

// Account table (for OAuth, etc.)
db.run(`
  CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    accessTokenExpiresAt TIMESTAMP,
    refreshTokenExpiresAt TIMESTAMP,
    scope TEXT,
    password TEXT,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL,
    FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
  )
`);

// Verification table
db.run(`
  CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
  )
`);

// Indexes
db.run(`
  CREATE INDEX IF NOT EXISTS "user_email_idx" ON "user"(email)
`);

db.run(`
  CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"(userId)
`);

db.run(`
  CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"(userId)
`);

db.run(`
  CREATE INDEX IF NOT EXISTS "account_providerId_providerAccountId_idx" ON "account"(providerId, providerAccountId)
`);

db.run(`
  CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"(identifier)
`);

db.run(`
  CREATE INDEX IF NOT EXISTS "verification_value_idx" ON "verification"(value)
`);

console.log("Database schema initialized successfully");