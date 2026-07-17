import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "postgres://citepilot:citepilot@localhost:5432/citepilot",
  jwt: {
    secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? "900", 10),
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN ?? "86400", 10),
  },
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL ?? "http://localhost:8000",
  },
  upload: {
    dir: process.env.UPLOAD_DIR ?? "./uploads",
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? "10485760", 10),
    allowedMimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
  },
};
