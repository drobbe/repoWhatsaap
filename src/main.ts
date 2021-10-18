import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WhatsappConfigService } from './config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,  { cors: true });

  const config = app.get(WhatsappConfigService);
	app.enableCors({
		origin: true,
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		credentials: true,
	});
  await app.listen(config.port);
  console.log(`WhatsApp HTTP API is running on: ${await app.getUrl()}`);
}

bootstrap();
