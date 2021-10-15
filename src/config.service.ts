import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappConfigService {
	public files_uri = '/api/files';
  public schema = 'http';

  constructor(private configService: ConfigService) {}

  get files_url(): string {
    return `${this.schema}://${this.hostname}:${this.port}${this.files_uri}/`;
  }

  get hostname(): string {
    return this.configService.get('WHATSAPP_API_HOSTNAME', 'localhost');
  }

  get port(): string {
    return this.configService.get('WHATSAPP_API_PORT', '3000');
  }

  get socketIoUrl(): string {
    return this.configService.get('URL_SOCKET', 'wss://realtime.sinaptica.io');
  }

  get files_folder(): string {
    return this.configService.get(
      'WHATSAPP_FILES_FOLDER',
      './tmp/whatsapp-files',
    );
  }

  get bot(): string {
    return this.configService.get('BOT');
  }

  get USER(): string {
    return this.configService.get('USER');
  }

  flow() {
    const flow = require('../src/flujos/' + this.get('BOT') + '.json');
    console.log('flow', flow);
    return flow;
  }

  get files_lifetime(): number {
    return this.configService.get<number>('WHATSAPP_FILES_LIFETIME', 180);
  }

  get mimetypes(): string[] | null {
    const types = this.configService.get('WHATSAPP_FILES_MIMETYPES', '');
    return types ? types.split(',') : null;
  }

  get(name: string): any {
    return this.configService.get(name);
  }
	/*
  public files_uri = '/api/files';
  public schema = 'http';

  constructor(private configService: ConfigService) {}

  get files_url(): string {
    return `${this.schema}://${this.hostname}:${this.port}${this.files_uri}/`;
  }
 
  get hostname(): string {
    return this.configService.get('WHATSAPP_API_HOSTNAME', 'localhost');
  }

  get port(): string {
    return this.configService.get('WHATSAPP_API_PORT', '3002');
  }

  get socketIoUrl(): string {
    return this.configService.get('URL_SOCKET', 'wss://realtime.sinaptica.io');
  }

  get files_folder(): string {
    return this.configService.get(
      'WHATSAPP_FILES_FOLDER',
      './tmp/whatsapp-files',
    );
  }

  get bot(): string {
    return this.configService.get('BOT');
  }

  get USER(): string {
    return this.configService.get('USER');
  }

  get files_lifetime(): number {
    return this.configService.get<number>('WHATSAPP_FILES_LIFETIME', 180);
  }

  get mimetypes(): string[] | null {
    const types = this.configService.get('WHATSAPP_FILES_MIMETYPES', '');
    return types ? types.split(',') : null;
  }

  get(name: string): any {
    return this.configService.get(name);
  }
	*/
}
