import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * App-wide settings. Shared by main.ts and the tests,
 * so the tests run against exactly the same configuration as production.
 */
export function configureApp(app: INestApplication): void {
  // All routes start with /api, e.g. /api/slots.
  app.setGlobalPrefix('api');

  // Only our frontend(s) may call the API from a browser.
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({ origin: allowedOrigins });

  // Validates every request body/query against its DTO class.
  // whitelist: unknown fields are stripped. transform: JSON is turned into DTO instances (runs @Transform).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
