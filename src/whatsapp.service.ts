import { create, Message, Whatsapp } from 'venom-bot';
// import { WhatsappMessage } from './interfaces/whattsapeMessage';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { WhatsappConfigService } from './config.service';
import mime = require('mime-types');
import fs = require('fs');
import del = require('del');
import { io } from 'socket.io-client';
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://realtime.sinaptica.io/v1/sinaptica/',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

const SECOND = 1000;

export const whatsappProvider = {
  provide: 'WHATSAPP',
  useFactory: async (config: ConfigService) =>
    create(
      'sessionName',
      (base64Qr, asciiQR) => {
        console.log(asciiQR);
      },
      statusFind => {
        console.log(statusFind);
      },
      {
        headless: true,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: true,
        browserArgs: ['--no-sandbox'],
        autoClose: 60000,
        createPathFileToken: true,
        puppeteerOptions: {},
      },
    ),
};

const ONMESSAGE_HOOK = 'onMessage';
const HOOKS = [
  ONMESSAGE_HOOK,
  'onStateChange',
  'onAck',
  // TODO: IMPLEMENTED THESE TOO
  // "onLiveLocation",
  // "onParticipantsChanged",
  'onAddedToGroup',
];
const ENV_PREFIX = 'WHATSAPP_HOOK_';

@Injectable()
export class WhatsappService implements OnApplicationShutdown {
  // TODO: Use environment variables
  private RETRY_DELAY = 15;
  private RETRY_ATTEMPTS = 3;
  readonly FILES_FOLDER: string;
  readonly mimetypes: string[] | null;
  readonly files_lifetime: number;
  readonly VERIFY_URL: string;

  private socket: any;
  private socketID: string;

  constructor(
    @Inject('WHATSAPP') private whatsapp: Whatsapp,
    private config: WhatsappConfigService,
    private log: Logger,
  ) {
    this.log.setContext('WhatsappService');
    this.FILES_FOLDER = path.resolve(__dirname, '../tmp/whatsapp-files');
    this.clean_downloads();
    this.mimetypes = this.config.mimetypes;
    this.files_lifetime = this.config.files_lifetime * SECOND;
    this.VERIFY_URL = config.get('VERIFY_URL');

    this.socket = io(config.get('URL_SOCKET'), { autoConnect: true });
    // this.socket.auth = { id: 1, username: 'rosales' };
    this.socket.on('connect', () => {
      this.socketID = this.socket.id;
    });
    // this.socket.on('message', data => console.log('data Mensagge', data));

    this.socket.on('message', data => {
      console.log('a client socket just fired a "create" event!');
    });

    this.socket.on('disconnect', () => {
      console.log('Se desconecto');
    }); // undefined});

    this.log.log('Configuring webhooks...');
    for (const hook of HOOKS) {
      const env_name = ENV_PREFIX + hook.toUpperCase();
      const url = config.get(env_name);
      if (!url) {
        this.log.log(
          `Hook '${hook}' is disabled. Set ${env_name} environment variable to url if you want to enabled it.`,
        );
        continue;
      }

      if (hook === ONMESSAGE_HOOK) {
        this.whatsapp[hook](data => this.onMessageHook(data, url));
      } else {
        this.whatsapp[hook](data => this.callWebhook(data, url));
      }
      this.log.log(`Hook '${hook}' was enabled to url: ${url}`);
    }
    this.log.log('Webhooks were configured.');
  }

  private clean_downloads() {
    console.log(this.FILES_FOLDER);
    console.log(fs.existsSync(this.FILES_FOLDER));
    if (fs.existsSync(this.FILES_FOLDER)) {
      del([`${this.FILES_FOLDER}/*`], { force: true }).then(paths =>
        console.log('Deleted files and directories:\n', paths.join('\n')),
      );
    } else {
      fs.mkdirSync(this.FILES_FOLDER);
      this.log.log(`Directory '${this.FILES_FOLDER}' created from scratch`);
    }
  }

  private async callWebhook(data: Message, url) {
    try {
      const idSender = data.sender.id;
      const formatPhone = this._splitPhone(idSender);
      let idChatWs = data.chatId;

      this.log.log('Verificando Si esta registrado');
      let isRegister = await this.isRegisterChat(formatPhone);

      if (isRegister === false) {
        this.log.log('no esta Registrado, registrando...');
        isRegister = await this.registerChat(formatPhone);
      } else {
        this.log.log('Esta Registrado Relajao relajao');
      }
      this.log.log(isRegister);
      let date = new Date().toLocaleString();
      let hola = {
        message: 'lugares de pago',
        chatOnline: {
          id: this.socketID,
          message: 'lugares de pago',
          time: date,
        },
        idChat: isRegister[0].idChat,
        idUsername: isRegister[0].idUsername,
      };
      console.log(hola);
      this.socket.emit('message', hola);

      // await this.whatsapp
      //   .sendText(phone, 'Title 😋')
      //   .then(result => {
      //     // console.log('Result: ', result); //return object success
      //   })
      //   .catch(erro => {
      //     console.error('Error when sending: ', erro); //return object error
      //   });
      // const Messages = await this.whatsapp.getAllMessagesInChat(
      //   phone,
      //   false,
      //   false,
      // );
      // console.log(Messages);
    } catch (error) {}
  }

  private async isRegisterChat(number: string): Promise<any> {
    return instance
      .get(`verifi/telephone/${number}`)
      .then(function(response) {
        return response.data;
      })
      .catch(function(error) {
        console.log(error);
        return error;
      });
  }

  private async registerChat(number: string): Promise<any> {
    return instance
      .post('/createChatUser', {
        idempresa: 2,
        message: [],
        chatbot: 'chatbot orcob',
        telefono: number,
      })
      .then(function(response) {
        return response.data;
      })
      .catch(function(error) {
        console.log(error);
        return error;
      });
  }

  private _splitPhone(whatsappId: string): string {
    return whatsappId.split('@')[0];
  }

  private async onMessageHook(message: Message, url: string) {
    if (message.isMMS || message.isMedia) {
      this.downloadAndDecryptMedia(message).then(data =>
        this.callWebhook(data, url),
      );
    } else {
      this.callWebhook(message, url);
    }
  }

  private async downloadAndDecryptMedia(message: Message) {
    return this.whatsapp.decryptFile(message).then(async buffer => {
      // Download only certain mimetypes
      if (
        this.mimetypes !== null &&
        !this.mimetypes.some(type => message.mimetype.startsWith(type))
      ) {
        this.log.log(
          `The message ${message.id} has ${message.mimetype} media, skip it.`,
        );
        message.clientUrl = '';
        return message;
      }

      this.log.log(`The message ${message.id} has media, downloading it...`);
      const fileName = `${message.id}.${mime.extension(message.mimetype)}`;
      const filePath = path.resolve(`${this.FILES_FOLDER}/${fileName}`);
      this.log.verbose(`Writing file to ${filePath}...`);
      await writeFileAsync(filePath, buffer);
      this.log.log(`The file from ${message.id} has been saved to ${filePath}`);

      message.clientUrl = this.config.files_url + fileName;
      this.removeFile(filePath);
      return message;
    });
  }

  onApplicationShutdown(signal?: string): any {
    this.log.log('Close a browser...');
    return this.whatsapp.close();
  }

  private removeFile(file: string) {
    setTimeout(
      () =>
        fs.unlink(file, () => {
          this.log.log(`File ${file} was removed`);
        }),
      this.files_lifetime,
    );
  }
}
