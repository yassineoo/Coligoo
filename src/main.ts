import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // allow all origins
    credentials: true,
  });
  app.setGlobalPrefix('/api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const config = new DocumentBuilder()
    .setTitle('Coligoo API')
    .setDescription('The Coligoo  API description')
    .setVersion('1.0')
    .addTag('Coligoo API')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  const configService = app.get(ConfigService);

  // ✅ Bind to 0.0.0.0 to expose publicly
  await app.listen(configService.get('APP_PORT'), '0.0.0.0');
}
bootstrap();
