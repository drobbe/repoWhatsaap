import { Logger, Module } from '@nestjs/common';
// import { ChattingController } from './api/chatting.controller';
// import { DeviceController } from './api/device.controller';
import { whatsappProvider, WhatsappService } from './whatsapp.service';
import { ScreenshotController } from './api/screenshot.controller';
import { ConfigModule } from '@nestjs/config';
import { WhatsappConfigService } from './config.service';
import { ServeStaticModule } from '@nestjs/serve-static';

console.log('###########################################################');
console.log('Iniciando bot : ' + process.argv[2]);
console.log('###########################################################');

@Module({
  imports: [
    WhatsappConfigService,
    ConfigModule.forRoot({
      envFilePath: ['./.env', `./src/env/${process.argv[2]}.env`],
      // envFilePath: ['./.env', './src/env/orcob_rutaMaipo.env'],
      isGlobal: true,
    }),
    ServeStaticModule.forRootAsync({
      imports: [WhatsappConfigService],
      extraProviders: [WhatsappConfigService],
      inject: [WhatsappConfigService],
      useFactory: (config: WhatsappConfigService) => {
        return [
          {
            rootPath: config.files_folder,
            serveRoot: config.files_uri,
          },
        ];
      },
    }),
  ],
  controllers: [ScreenshotController],
  providers: [whatsappProvider, WhatsappService, Logger, WhatsappConfigService],
})
export class AppModule {}
