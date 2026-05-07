import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  const allowedOrigins = String(process.env.CLIENT_URL).split(',');
  app.set('trust proxy', 1);
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
