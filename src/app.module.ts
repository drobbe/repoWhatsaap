import { ConfigModule } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

import { whatsappProvider, WhatsappService } from './whatsapp.service';
import { ScreenshotController } from './api/screenshot.controller';
import { WhatsappConfigService } from './config.service';
import { ChatGateway } from './websoquet/whatsapp';

console.log('###########################################################');
console.log('Iniciando bot : ' + process.argv[2]);
console.log('###########################################################');
@Module({

  imports: [
    WhatsappConfigService,
    ConfigModule.forRoot({  
			envFilePath: ['./.env', `./src/env/${process.argv[2]}.env`],
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
  providers: [whatsappProvider, WhatsappService, Logger, WhatsappConfigService, ChatGateway ],
})
export class AppModule {}
