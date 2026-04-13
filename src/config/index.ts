import { config } from "./environment";

export {
  databaseConfig,
  connectDatabase,
  checkDatabaseHealth,
} from "./database";

export { config };

// Re-export commonly used config values
export const { port, nodeEnv, apiPrefix, isDevelopment, isProduction, isTest } =
  config;
