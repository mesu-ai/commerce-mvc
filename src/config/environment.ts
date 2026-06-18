import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // API Configuration
  apiPrefix: process.env.API_PREFIX || "/api/v1",

  // Database Configuration (for future use)
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME || "express_mvc_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
  },

  // JWT Configuration (for future use)
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  // App Configuration
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
};

// Validate required environment variables in production
if (config.isProduction) {
  const requiredEnvVars = ["JWT_SECRET"];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(", ")}`
    );
  }
}
