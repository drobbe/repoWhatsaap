import { Chat, create, Message, Whatsapp } from 'venom-bot';
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
import { Branch, ChatBot } from './interfaces/chatbots';
import { ChatInMemory } from './interfaces/chats';
import { setInterval } from 'timers';
import { WebSocketChat, WebSocketMessage } from './interfaces/webSocketMessage';
import { Console } from 'console';
import { DateTime } from 'luxon';
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
      (base64Qr, asciiQR, attempt, urlCode) => {
        console.log('generando codigo qr');
        // console.log(attempt);
        // console.log(urlCode);
        // console.log(base64Qr);
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

  readonly optionAvailable = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  private chatBot: ChatBot;
  private menuBranch: Branch;
  private bot: string;

  private activeChats: ChatInMemory[] = [];

  private socket: any;
  private userName: any;

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
    this.userName = config.get('USER');

    // console.log('userName', this.userName);

    this.bot = config.get('BOT');
    this.chatBot = config.flow();

    this.menuBranch = this.chatBot.branchs.find(c => c.menu === true);

    this.socket = io(config.get('URL_SOCKET'), { autoConnect: true });
    this.socket.auth = { id: this.userName, username: 'test' };
    this.socket.on('connect', () => {});
    // this.socket.on('message', data => console.log('data Mensagge', data));

    this.socket.on('orcob_falabella', (data: WebSocketMessage) => {
      this.log.warn('------Websocket------');
      this.log.warn(data);
      this.log.warn('------Websocket------');
      const idChatInMemory = this.findIdChatByIdChat(data.idChat);
      this.activeChats[idChatInMemory].queueMesage++;

      setTimeout(() => {
        this._handleWebsocketSimpleMessage(data);
        this.activeChats[idChatInMemory].queueMesage--;
      }, (this.activeChats[idChatInMemory].queueMesage - 1) * 500);
    });

    this.socket.on('chatOnline', (data: WebSocketChat) => {
      this.log.warn('------Chat Online------');
      const idChatInMemory = this.findIdChatByIdChat(data.idChat);
      this._sendText(this.activeChats[idChatInMemory].idSender, data.content);
      this.log.warn('------Chat Online------');
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

    let clase = this;
    // setInterval(function() {
    //   clase.log.log('###################');
    //   clase.log.log(clase.activeChats);
    //   clase.log.log('###################');
    // }, 3000);
  }

  private async callWebhook(data: Message, url) {
    try {
      const idSender = data.sender.id;

      const formatPhone = this._splitPhone(idSender);
      let idChatWs = data.chatId;

      const chatIdInMemory = await this._handleChat(formatPhone, idSender);

      if (this.activeChats[chatIdInMemory].greetins === true) {
        await this.greetins(chatIdInMemory);
        await this.menu(chatIdInMemory);
        return;
      }

      if (this.activeChats[chatIdInMemory].asesorOnline === true) {
        if (data.content.toLowerCase().trim() === 'salir') {
          this._desactiveChatWithAgent(chatIdInMemory);
          this._sendText(idSender, this.chatBot.goodbye);
          return;
        }
        await this._sendMessageToAgent(chatIdInMemory, data.content);
        return;
      }

      if (this.activeChats[chatIdInMemory].affirmation === true) {
        await this._handleAffirmation(chatIdInMemory, data);
        return;
      }

      if (this.activeChats[chatIdInMemory].form.active === true) {
        this.sendToSocketForm(chatIdInMemory, data);
        return;
      }

      this.sendToSocket(chatIdInMemory, data);
    } catch (error) {
      console.log(error);
    }
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

  async sendToSocket(chatIdInMemory: number, message: Message) {
    try {
      let msg = message.body;

      let date = new Date().toLocaleString();

      let branch = this.getEventOfMessage(
        msg,
        this.activeChats[chatIdInMemory].lastBranch,
      );
      if (branch === null) return this.sendDefaultMesagge(chatIdInMemory);

      let socketMsg = {
        chatOnline: {
          id: null,
          message: '',
          time: date,
        },
        idChat: this.activeChats[chatIdInMemory].idChat,
        idUsername: this.userName,
        message: branch.event,
      };

      this.activeChats[chatIdInMemory].lastBranch = branch.id;

      if (branch.type === 'chabot') {
        this._activeChatWithAgent(chatIdInMemory);
        return;
      }

      this.socket.emit(this.bot, socketMsg);
    } catch (error) {
      console.log(error);
    }
  }

  async sendToSocketForm(chatIdInMemory: number, message: Message) {
    let date = new Date().toLocaleString();
    let msg = message.body.trim().toLowerCase();

    let positionActiveQuestion = this.activeChats[chatIdInMemory].form
      .activeQuestion;

    this.activeChats[chatIdInMemory].form.questions[
      positionActiveQuestion
    ].value = message.body;

    //si es el ulitmo mensaje del fomrulaio
    if (
      this.activeChats[chatIdInMemory].form.activeQuestion ===
      this.activeChats[chatIdInMemory].form.questions.length - 1
    ) {
      let branch = this.findBranchID(
        this.activeChats[chatIdInMemory].lastBranch,
        msg,
        this.chatBot.branchs,
      );

      let socketMsg = {
        chatOnline: {
          id: null,
          message: '',
          time: date,
        },
        idChat: this.activeChats[chatIdInMemory].idChat,
        idUsername: this.userName,
        message: branch.form.message,
      };

      this.activeChats[chatIdInMemory].form.questions.forEach(q => {
        socketMsg[q.parrameter] = q.value;
      });

      socketMsg['idUser'] = this.userName;

      this.activeChats[chatIdInMemory].lastBranch = branch.id;

      this.socket.emit(branch.socket, socketMsg);
      this.cleanActiveForm(chatIdInMemory);
    } else {
      if (this.activeChats[chatIdInMemory].idSender !== '51994290430@c.us')
        return;
      await this.whatsapp
        .sendText(
          this.activeChats[chatIdInMemory].idSender,
          this.activeChats[chatIdInMemory].form.questions[
            positionActiveQuestion + 1
          ].message,
        )
        .then(result => {
          this.activeChats[chatIdInMemory].form.activeQuestion++;
        })
        .catch(erro => {
          console.error('Error when sending: ', erro); //return object errormenu
        });
    }
  }

  private async _handleChat(formatPhone, idSender): Promise<number> {
    try {
      let isRegister: any;
      isRegister = false;
      const index = this.activeChats.findIndex(a => (a.idSender = idSender));
      if (index !== -1) {
        this.log.log('Esta en Memoria ... ❄️❄️');

        return index;
      }

      isRegister = await this.isRegisterChat(formatPhone);

      // console.log('isRegister', isRegister, formatPhone);

      if (isRegister === false) {
        this.log.log('No esta Registrado, registrando... ✋✋');
        isRegister = await this.registerChat(formatPhone);
        isRegister = isRegister.response[0];
      } else {
        this.log.log('Chat Registrado ✊✊');

        isRegister = isRegister[0];
      }
      isRegister = new ChatInMemory(isRegister);
      isRegister.idSender = idSender;
      return this.activeChats.push(isRegister) - 1;
    } catch (error) {
      console.log(error);
    }
  }

  // private isInMemoryByPhone(formatPhone) {
  //   return this.activeChats.find(c => c.telefono === formatPhone);
  // }

  private async isRegisterChat(number: string): Promise<any> {
    return instance
      .get(`verifi/telephone/${number}`)
      .then(function(response) {
        if (response.data.length === 0) return false;
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
        idempresa: this.userName,
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

  private handleMesagges() {}

  private _handleWebsocketSimpleMessage(data: WebSocketMessage) {
    const idChatInMemory = this.findIdChatByIdChat(data.idChat);
    let isMessageForm = false;

    if (data.formConsulta === true || data.formCompromiso === true) {
      this.activeForm(idChatInMemory, data);
      isMessageForm = true;
    }

    //Evaluar si el mensaje es un formulario
    const msg =
      isMessageForm === true
        ? this.activeChats[idChatInMemory].form.questions[0].message
        : data.message;

    if (this.activeChats[idChatInMemory].idSender !== '51994290430@c.us')
      return;
    this.whatsapp
      .sendText(this.activeChats[idChatInMemory].idSender, msg)
      .then(result => {
        this.log.log('Se esta mandando al webSocket ☀️☀️'); //return object success

        if (data.buttonMenuOptions === true)
          this.showAffirmation(idChatInMemory);
      })
      .catch(erro => {
        console.error('Error when sending: ', erro); //return object errormenu
      });
  }

  private async _handleAffirmation(chatIdInMemory, message: Message) {
    let msg = message.body.trim().toLocaleUpperCase();
    let index = this.optionAvailable.findIndex(o => o === msg);

    if (index === -1)
      index = this.chatBot.affirmation.findIndex(a => a.text === msg);

    if (index === -1) return this.sendDefaultMesagge(chatIdInMemory);

    let affirmation = this.chatBot.affirmation[index];
    if (affirmation.destiny.going) {
      this.log.log('----------------aqui hay que hacer algo -----------');
      return;
    }
    if (affirmation.destiny.showMenu) return await this.menu(chatIdInMemory);
    if (affirmation.destiny.toMenu) {
      this.activeChats[chatIdInMemory].greetins = false;
      this.activeChats[chatIdInMemory].lastBranch = this.menuBranch.id;
      this.activeChats[chatIdInMemory].affirmation = false;
    }
    if (affirmation.destiny.showGoodbye) {
      if (this.activeChats[chatIdInMemory].idSender !== '51994290430@c.us')
        return;
      await this.whatsapp
        .sendText(
          this.activeChats[chatIdInMemory].idSender,
          this.chatBot.goodbye,
        )
        .then(result => {
          this.log.log('Se esta despidiendo ❌❌'); //return object success
        })
        .catch(erro => {
          console.error('Error when sending: ', erro); //return object errormenu
        });
    }
  }

  private activeForm(idChatInMemory: number, dataWebsocket: WebSocketMessage) {
    this.activeChats[idChatInMemory].form = {
      active: true,
      questions: dataWebsocket.whatsapp.messages,
      activeQuestion: 0,
      socket: dataWebsocket.whatsapp.socket,
    };
  }

  /* uSAR ESTA FUNCION PARA MANDAR */
  // async sendText(chatIdInMemory: number, text: string) {
  //   setTimeout(() => {
  //     this.whatsapp
  //       .sendText(this.activeChats[chatIdInMemory].idSender, text)
  //       .then(result => {
  //         this.log.log('Enviando siguiente formulario ✅✅'); //return object success
  //       })
  //       .catch(erro => {
  //         console.error('Error when sending: ', erro); //return object errormenu
  //       });
  //   }, 250);
  // }

  cleanActiveForm(chatIdInMemory: number) {
    this.activeChats[chatIdInMemory].form.active = false;
    delete this.activeChats[chatIdInMemory].form.socket;
    delete this.activeChats[chatIdInMemory].form.activeQuestion;
    delete this.activeChats[chatIdInMemory].form.questions;
  }

  getEventOfMessage(msg: string, lastBranch: number): Branch | null {
    msg = msg.trim().toLocaleUpperCase();
    const index = this.optionAvailable.findIndex(o => o === msg);

    let findedBranch = this.findBranchID(lastBranch, msg, this.chatBot.branchs);
    if (
      index !== -1 &&
      findedBranch !== null &&
      findedBranch.branchs !== undefined &&
      findedBranch.branchs[index] !== undefined
    )
      return findedBranch.branchs[index];

    return null;
  }

  findBranchID(id, text: string, branchs: Branch[]) {
    return branchs.reduce((a, item) => {
      if (a) return a;
      if (item.id === id) return item;
      if (item.text !== undefined && item.text.toLowerCase() === text)
        return item;
      if (item.branchs) return this.findBranchID(id, text, item.branchs);
    }, null);
  }

  async greetins(idChatInMemory: number) {
    for (const message of this.chatBot.greetings) {
      if (this.activeChats[idChatInMemory].idSender !== '51994290430@c.us')
        return;
      await this.whatsapp
        .sendText(this.activeChats[idChatInMemory].idSender, message)
        .then(result => {
          this.log.log('Se esta Saludando ✨✨'); //return object success
        })
        .catch(erro => {
          console.error('Error when sending: ', erro); //return object errormenu
        });
    }
    this.activeChats[idChatInMemory].greetins = false;
    this.activeChats[idChatInMemory].lastBranch = null;
    this.activeChats[idChatInMemory].affirmation = false;
  }

  async menu(idChatInMemory: number) {
    let i = 0;
    for (const branch of this.menuBranch.branchs) {
      if (branch.enabled === true) {
        if (this.activeChats[idChatInMemory].idSender !== '51994290430@c.us')
          return;
        await this.whatsapp
          .sendText(
            this.activeChats[idChatInMemory].idSender,
            `*${this.optionAvailable[i]})* - ${branch.text}`,
          )
          .then(result => {
            this.log.log('Estas poniendo en el menu ⚙️⚙️'); //return object success
          })
          .catch(erro => {
            console.error('Error when sending: ', erro); //return object error
          });
        i++;
      }
    }
    this.activeChats[idChatInMemory].greetins = false;
    this.activeChats[idChatInMemory].lastBranch = this.menuBranch.id;
    this.activeChats[idChatInMemory].affirmation = false;
  }

  async showAffirmation(idChatInMemory: number) {
    let i = 0;
    const afirmationBranch = this.chatBot.affirmation;
    for (const branch of afirmationBranch) {
      if (branch.enabled === true) {
        if (this.activeChats[idChatInMemory].idSender !== '51994290430@c.us')
          return;
        await this.whatsapp
          .sendText(
            this.activeChats[idChatInMemory].idSender,
            `*${this.optionAvailable[i]})* - ${branch.text}`,
          )
          .then(result => {
            this.log.log('Mostrando Afirmaciones ❓❓'); //return object success
          })
          .catch(erro => {
            console.error('Error when sending: ', erro); //return object error
          });
        i++;
      }
    }
    this.activeChats[idChatInMemory].greetins = false;
    this.activeChats[idChatInMemory].lastBranch = null;
    this.activeChats[idChatInMemory].affirmation = true;
  }

  sendDefaultMesagge(idChatInMemory: number) {
    if (this.activeChats[idChatInMemory].idSender !== '51994290430@c.us') {
      return;
    }
    this.whatsapp
      .sendText(this.activeChats[idChatInMemory].idSender, this.chatBot.default)
      .then(result => {
        this.log.log('Enviando Mensajes default ❕❕');
        this.menu(idChatInMemory);
      })
      .catch(erro => {
        console.error('Error when sending: ', erro); //return object error
      });
  }

  findIdChatByIdChat(idChat: number): number {
    return this.activeChats.findIndex(c => (c.idChat = idChat));
  }

  private _splitPhone(whatsappId: string): string {
    return whatsappId.split('@')[0];
  }

  private _activeChatWithAgent(idChatInMemory: number) {
    let clase = this;

    return instance
      .post(`https://realtime.sinaptica.io/v1/sinaptica/asignedAsesor`, {
        idEmpresa: this.userName,
        idusername: this.activeChats[idChatInMemory].idUsername,
        idchat: this.activeChats[idChatInMemory].idChat,
      })
      .then(function(response) {
        this.log.warn('------asignedAsesor------');
        this.log.warn(response.data);
        this.log.warn('------asignedAsesor------');

        if (
          response.data.hasOwnProperty('idAsesor') &&
          response.data.idAsesor > 0
        ) {
          clase.activeChats[idChatInMemory].asesorOnline = true;
          clase.activeChats[idChatInMemory].idAsesor = response.data.idAsesor;
          clase._sendText(
            clase.activeChats[idChatInMemory].idSender,
            'En breves momentos un asesor se comunicara con ud. Gracias, Escriba *["Salir"]* para poder Volver al chatbot',
          );
        } else {
          clase._sendText(
            clase.activeChats[idChatInMemory].idSender,
            response.data.message,
          );
        }
      })
      .catch(function(error) {
        console.log(error);
        clase._sendText(
          clase.activeChats[idChatInMemory].idSender,
          'En estos momentos no hay asesor disponible, comuniquese mas tarde. Gracias',
        );
      });
  }

  private _desactiveChatWithAgent(idChatInMemory: number) {
    this.activeChats[idChatInMemory].asesorOnline = false;
    this.activeChats[idChatInMemory].greetins = true;
    this.activeChats[idChatInMemory].idAsesor = null;
  }

  _sendMessageToAgent(idChatInMemory: number, text: string) {
    const msg = {
      time: null,
      content: text,
      ID_dest: this.activeChats[idChatInMemory].idAsesor,
      ID_emet: this.userName,
      idChat: this.activeChats[idChatInMemory].idChat,
    };
    console.log('Mensaje a enviar es : ', msg);
    this.socket.emit('chatOnline', msg);
  }

  async _sendText(idSender: string, text: string) {
    await this.whatsapp
      .sendText(idSender, text)
      .then(result => {
        return result;
      })
      .catch(erro => {
        console.error('Error when sending: ', erro); //return object error
      });
  }

  //Externo

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
}
