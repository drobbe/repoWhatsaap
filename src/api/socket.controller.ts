import { io } from 'socket.io-client';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('api')
export class SocketController {
  public socket: any;
  public userName: string;
  public config: any;
  constructor() {
    this.config = new ConfigService();
    this.userName = this.config.get('USER');
    this.socket = io(this.config.get('URL_SOCKET'), { autoConnect: true });
    this.socket.on('connect', () => {});
  }

  public emit(event: string, msg: string) {
    this.socket.emit(event, msg);
  }
}
