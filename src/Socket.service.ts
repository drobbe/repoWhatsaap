import { Injectable } from '@nestjs/common';
import { io } from 'socket.io-client';
import { WhatsappConfigService } from './config.service';

import { Controller } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  public socket: any;
  public userName: string;
  constructor(private config: WhatsappConfigService) {
    this.userName = config.get('USER');
    this.socket = io(config.get('URL_SOCKET'), { autoConnect: true });
    this.socket.auth = { id: this.userName, username: 'test' };
    this.socket.on('connect', () => {});
  }

  public emit(msg: string) {
    this.socket.emit('CodigoQr', msg);
  }
}
