import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import helmet from 'helmet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import configurations from './config/configurations';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [configurations],
      expandVariables: true,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: minutes(10),
            limit: 100,
          },
        ],
        skipIf: () => configService.get<string>('nodeEnv') !== 'production',
      }),
    }),
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(helmet()).forRoutes('*');
  }
}
