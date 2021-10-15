import { create, Message, Whatsapp } from 'venom-bot';
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
import { Branch, ChatBot } from './interfaces/chatbots';
import { ChatInMemory } from './interfaces/chats';

import { saveUserNotFound, consultaRutUsername} from './helper/helper.whatsapp';
//import { whatsappMenu } from './helper/message.whatsap';
import { ApiSinaptica } from './services/api.sinaptica'
import { WebSocketChat, WebSocketMessage } from './interfaces/webSocketMessage';

const SECOND = 1000;
import { promisify } from "util";
const writeFileAsync = promisify(fs.writeFile);

export const whatsappProvider = {
  provide: 'WHATSAPP',
  useFactory: async (config: ConfigService) =>
    create('sessionName',(base64Qr, asciiQR, attempt, urlCode) => {
        console.log('generando codigo qr');
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
  'onAddedToGroup',
];
const ENV_PREFIX = 'WHATSAPP_HOOK_';

@Injectable()
export class WhatsappService implements OnApplicationShutdown {

  readonly FILES_FOLDER: string;
  readonly mimetypes: string[] | null;
  readonly files_lifetime: number;
  readonly VERIFY_URL: string;
  readonly optionAvailable = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
	readonly idEmpresa: number = 0;

  private chatBot: ChatBot;
  private menuBranch: Branch;
	private eventEmmiter: string;
  private activeChats: ChatInMemory[] = [];
  private socket: any;

	private apiSinaptica: any;
  constructor(
    @Inject('WHATSAPP') private whatsapp: Whatsapp,
    private config: WhatsappConfigService){

		this.apiSinaptica = new ApiSinaptica();
    this.FILES_FOLDER = path.resolve(__dirname, '../tmp/whatsapp-files');
    this.clean_downloads();
    this.mimetypes = this.config.mimetypes;
    this.files_lifetime = this.config.files_lifetime * SECOND;
    this.VERIFY_URL = config.get('VERIFY_URL');

		this.idEmpresa = Number(config.get('USER'))
		this.eventEmmiter = config.get('BOT');
    this.chatBot = config.flow();
		console.log("::::::::::::::::.. init ::::::::::::::")
		console.log( this.chatBot.greetings)
		console.log("::::::::::::::::.. init ::::::::::::::")
    this.menuBranch = this.chatBot.branchs.find(c => c.menu === true);
		this.socket = io('wss://realtime.sinaptica.io', { autoConnect: true });
    //this.socket = io('ws://localhost:8089', { autoConnect: true });
    this.socket.auth = { id: 1000, username: 'whastsapp' };

    this.socket.on('whatsapp', (data: any) => {
			console.log("::::::::::::::::.. whatsapp ::::::::::::::")
			console.log(data)
			console.log("::::::::::::::::.. whatsapp ::::::::::::::")
      const idChatInMemory = this.activeChats.findIndex(c => (c.idChat = data.idChat));
			this.sendMessageWhatsapp(this.activeChats[idChatInMemory].idSender, data.message)
    });

		this.socket.on(this.eventEmmiter, (data: any) => {
			console.log('------Websocket------');
      console.log(data);
      console.log('------Websocket------');
      const idChatInMemory = this.activeChats.findIndex(c => (c.idChat = data.idChat));
      this.activeChats[idChatInMemory].queueMesage++;
      setTimeout(() => {
        this._handleWebsocketSimpleMessage(idChatInMemory, data);
        this.activeChats[idChatInMemory].queueMesage--;
      }, (this.activeChats[idChatInMemory].queueMesage - 1) * 500);
		})

    for(const hook of HOOKS) {
      const env_name = ENV_PREFIX + hook.toUpperCase();
      const url = config.get(env_name);
      if(!url)continue;
      
      if(hook === ONMESSAGE_HOOK) {
        this.whatsapp[hook](data => this.onMessageHook(data));
      } else {
        this.whatsapp[hook](data => this.callWebhook(data));
      }
    }
  }

	private async onMessageWhatsap(idChatInMemory: number, whatsapp: Array<any>){
		whatsapp.forEach((element, index) => {
			setTimeout(() => {
				this._handleWebsocketSimpleMessage(idChatInMemory, element);
			}, index * 2000);
		})
	}

  private async callWebhook(data: Message) {
    try {
      const idSender = data.sender.id;
      const formatPhone = this._splitPhone(idSender);
      const chatIdInMemory = await this._handleChat(formatPhone, idSender);
			console.log("+++++++++++++ general +++++++++++")
			console.log(this.activeChats[chatIdInMemory])
			console.log("+++++++++++++ general +++++++++++")
      if(this.activeChats[chatIdInMemory].greetins === true) {
        await this.greetins(chatIdInMemory);
        return;
      }

      if(this.activeChats[chatIdInMemory].asesorOnline === true) {
        if(data.content.toLowerCase().trim() === 'salir') {
          this._desactiveChatWithAgent(chatIdInMemory);
					this.sendMessageWhatsapp(idSender, this.chatBot.goodbye)
          return;
        }
        await this._sendMessageToAgent(chatIdInMemory, data.content);
        return;
      }
      if(this.activeChats[chatIdInMemory].affirmation === true){
        await this._handleAffirmation(chatIdInMemory, data);
        return;
      }
			if(this.activeChats[chatIdInMemory].userNotFound === true){
        await this.sendMsgUserNotFound(chatIdInMemory, data);
        return;
      }
      if(this.activeChats[chatIdInMemory].form.active === true){
        this.sendToSocketForm(chatIdInMemory, data);
        return;
      }
      this.sendToSocket(chatIdInMemory, data);
    } catch (error) {}
  }

  private async onMessageHook(message: Message) {
    if(message.isMMS || message.isMedia) {
      this.downloadAndDecryptMedia(message).then(data => this.callWebhook(data));
    } else {
      this.callWebhook(message);
    }
  }

  async sendToSocket(chatIdInMemory: number, message: Message) {
    try {
      const branch = this.getEventOfMessage(message.body, this.activeChats[chatIdInMemory].lastBranch);
			if(branch === null) return this.sendDefaultMesagge(chatIdInMemory);
			if(branch.type === 'chabot'){
        this._activeChatWithAgent(chatIdInMemory);
        return;
      }

      this.activeChats[chatIdInMemory].lastBranch = branch.id;
			const sendWhatsapp = {
        chatOnline: {
          id: this.activeChats[chatIdInMemory].idUsername,
          message: branch.event,
          time: new Date().toLocaleString(),
        },
        idChat: this.activeChats[chatIdInMemory].idChat,
        idUsername: this.activeChats[chatIdInMemory].idUsername,
        message: branch.event,
				plataforma: 'whatsapp'
      }
			//const mesageWhatsapp = await whatsappMenu(sendWhatsapp);
			//if(!mesageWhatsapp.length)return
			//await this.onMessageWhatsap(chatIdInMemory, mesageWhatsapp)
			this.socket.emit(this.eventEmmiter, sendWhatsapp);
    } catch (error) {}
  }

	async sendMsgUserNotFound(chatIdInMemory: number, message: Message) {

    const indexProcess = this.activeChats[chatIdInMemory].userNotFoundForm.indexProcess;
    this.activeChats[chatIdInMemory].userNotFoundForm.informations[indexProcess].value = message.body;
		if(
      this.activeChats[chatIdInMemory].userNotFoundForm.indexProcess ===
      this.activeChats[chatIdInMemory].userNotFoundForm.informations.length - 1)
		{
			const socketMsg = {
				idUser: this.activeChats[chatIdInMemory].idUsername,
        idChat: this.activeChats[chatIdInMemory].idChat,
				message: "registrando usuario",
				idEmpresa: this.idEmpresa,
      };
      this.activeChats[chatIdInMemory].userNotFoundForm.informations.forEach(item => {
        socketMsg[item.parrameter] = item.value;
      });
			this.activeChats[chatIdInMemory].userNotFound=false;
			this.activeChats[chatIdInMemory].userNotFoundForm.indexProcess=0;

			const saveNotFound = await saveUserNotFound(socketMsg)
			if(!saveNotFound.length) return;
			await this.onMessageWhatsap(chatIdInMemory, saveNotFound)
    } else {
			const response = await this.sendMessageWhatsapp(this.activeChats[chatIdInMemory].idSender, this.activeChats[chatIdInMemory].userNotFoundForm.informations[indexProcess + 1].message);
      if(response=== true)
				this.activeChats[chatIdInMemory].userNotFoundForm.indexProcess++;
    }
  }

  async sendToSocketForm(chatIdInMemory: number, message: Message) {
		const date = new Date().toLocaleString();
    const msg = message.body.trim().toLowerCase();
    const positionActiveQuestion = this.activeChats[chatIdInMemory].form.activeQuestion;
		try {
			this.activeChats[chatIdInMemory].form.questions[positionActiveQuestion].value = message.body;
			if(this.activeChats[chatIdInMemory].form.activeQuestion===this.activeChats[chatIdInMemory].form.questions.length - 1){
				const branch = this.findBranchID(this.activeChats[chatIdInMemory].lastBranch, msg, this.chatBot.branchs);
				if(branch == undefined){
					/** este caso regularmente es en primermomento cuando consulta el usuario */
					const questions = this.activeChats[chatIdInMemory].form.questions[positionActiveQuestion];				
					const saveConsulta = await consultaRutUsername({ idChat: this.activeChats[chatIdInMemory].idChat, idUser: this.activeChats[chatIdInMemory].idUsername,	rutUser: msg,	message: questions.message })
					this.cleanActiveForm(chatIdInMemory);
					if(!saveConsulta.length) return;
					await this.onMessageWhatsap(chatIdInMemory, saveConsulta)
					return
				}
	
				///ojoooooooooooooooooooooooooooo
				const socketMsg = {
					chatOnline: {
						id: this.activeChats[chatIdInMemory].idUsername,
						message: branch.form.message,
						time: date,
					},
					idChat: this.activeChats[chatIdInMemory].idChat,
					idUsername: this.activeChats[chatIdInMemory].idUsername,
					message: branch.form.message,
					idUser: this.activeChats[chatIdInMemory].idUsername,
				};
	
				this.activeChats[chatIdInMemory].form.questions.forEach(q => {
					socketMsg[q.parrameter] = q.value;
				});
				this.activeChats[chatIdInMemory].lastBranch = branch.id;
				this.socket.emit(branch.socket, socketMsg);
				this.cleanActiveForm(chatIdInMemory);
			} else {
				const response = await this.sendMessageWhatsapp(this.activeChats[chatIdInMemory].idSender, this.activeChats[chatIdInMemory].form.questions[positionActiveQuestion + 1].message);
				if(response=== true)
					this.activeChats[chatIdInMemory].form.activeQuestion++;
			}
		} catch (error) {}
  }

  private async _handleChat(formatPhone, idSender): Promise<number> {
    try {
      const index = this.activeChats.findIndex(a => (a.idSender = idSender));
      if(index !== -1)return index

			let isRegister = await this.apiSinaptica.verifyUsername(formatPhone)
			console.log("verificando")
			console.log(isRegister)
			console.log("verificando")
      if(isRegister === false) {
				isRegister = await this.apiSinaptica.createUsername(this.idEmpresa, formatPhone) ;
      }
      const element = new ChatInMemory(isRegister, idSender);
      return this.activeChats.push(element) - 1;
    } catch (error) {}
  }

  private async  _handleWebsocketSimpleMessage(idChatInMemory: number, data: WebSocketMessage) {

    let isMessageForm = false;
    if(data.formConsulta === true || data.formCompromiso === true) {
      this.activeForm(idChatInMemory, data);
      isMessageForm = true;
    }
		/** actualiza si esta actualizado el nombre o existe ese usuario */
		if(data.updateUser === true){
			this.activeChats[idChatInMemory].updateUsername = true
		} else if(data.updateUser === false){
			//evaluar  si es formulario de usuario no encontrado
			this.activeChats[idChatInMemory].updateUsername = false;
			this.activeFormUserNotFound(idChatInMemory, data)
			return
		}

		if(isMessageForm === true){
			const response = await this.sendMessageWhatsapp(this.activeChats[idChatInMemory].idSender, this.activeChats[idChatInMemory].form.questions[0].message);
			if(response===true){
				if(data.buttonMenuOptions === true)
					this.showAffirmation(idChatInMemory);
			}
		} else {
			const response = await this.sendMessageWhatsapp(this.activeChats[idChatInMemory].idSender, this.optionsMenu(data.message));
			if(response===true){
				if(data.buttonMenuOptions === true)
					this.showAffirmation(idChatInMemory);
			}
		}
  }

	optionsMenu(message: string){
		if(message=="Seleccione su lugar de pago:")
			return message += this.chatBot.aditional.find(item => item.index===0).message;
		else if(message=="Seleccione forma de pago:")	
			return message += this.chatBot.aditional.find(item => item.index===1).message;
		else if(message=="ofertas vigentes:")	
			return message += this.chatBot.aditional.find(item => item.index===2).message;
		else if(message=="Agenda de llamada en proceso") 
			return message += this.chatBot.aditional.find(item => item.index===3).message;
		else return message;
	}

	private async sendMessageWhatsapp(number: string, message: string){
		//if(number !== '51941453211@c.us') return;	
		return this.whatsapp.sendText(number, message)
    .then(result => {	return true})
		.catch(error => {  return false});
	}

  private async _handleAffirmation(chatIdInMemory, message: Message) {
    const msg = message.body.trim().toLocaleUpperCase();
    let index = this.optionAvailable.findIndex(o => o === msg);
    if(index === -1){
			index = this.chatBot.affirmation.findIndex(a => a.text === msg);
		}
    if(index === -1){
			return this.sendDefaultMesagge(chatIdInMemory);
		}
    const affirmation = this.chatBot.affirmation[index];
    if(affirmation.destiny.going){
      return;
    }
    if(affirmation.destiny.showMenu){
			return await this.menu(chatIdInMemory);
		}
    if(affirmation.destiny.toMenu){
      this.activeChats[chatIdInMemory].greetins = false;
      this.activeChats[chatIdInMemory].lastBranch = this.menuBranch.id;
      this.activeChats[chatIdInMemory].affirmation = false;
    }

    if(affirmation.destiny.showGoodbye) {
			await this.sendMessageWhatsapp(this.activeChats[chatIdInMemory].idSender, this.chatBot.goodbye)
			console.log('Se esta despidiendo ❌❌');
    }
  }

	private async activeFormUserNotFound(idChatInMemory: number, dataWebsocket: WebSocketMessage) {
		this.activeChats[idChatInMemory].form.active = false
		this.activeChats[idChatInMemory].userNotFound = true;
    this.activeChats[idChatInMemory].userNotFoundForm = this.chatBot.userNotFoundForm;
		const primerEnvio = this.activeChats[idChatInMemory].userNotFoundForm.informations[0].message
		await this.sendMessageWhatsapp(this.activeChats[idChatInMemory].idSender, dataWebsocket.message)
		await this.sendMessageWhatsapp(this.activeChats[idChatInMemory].idSender, primerEnvio)
  }

  private activeForm(idChatInMemory: number, dataWebsocket: WebSocketMessage) {
    this.activeChats[idChatInMemory].form = {
      active: true,
      questions: dataWebsocket.whatsapp.messages,
      activeQuestion: 0,
      socket: dataWebsocket.whatsapp.socket,
    };
  }

  cleanActiveForm(chatIdInMemory: number) {
    this.activeChats[chatIdInMemory].form.active = false;
    delete this.activeChats[chatIdInMemory].form.socket;
    delete this.activeChats[chatIdInMemory].form.activeQuestion;
    delete this.activeChats[chatIdInMemory].form.questions;
  }

  getEventOfMessage(msg: string, lastBranch: number): Branch | null {

    msg = msg.trim().toLocaleUpperCase();
    const index = this.optionAvailable.findIndex(o => o === msg);
    const findedBranch = this.findBranchID(lastBranch, msg, this.chatBot.branchs);
    if(index!==-1 && findedBranch!==null &&  findedBranch.branchs!==undefined && findedBranch.branchs[index]!==undefined){
      return findedBranch.branchs[index];
		}
    return null;
  }

  findBranchID(id, text: string, branchs: Branch[]) {
    return branchs.reduce((a, item) => {
      if(a) return a;
      if(item.id === id) return item;
      if(item.text !== undefined && item.text.toLowerCase() === text)return item;
      if(item.branchs) return this.findBranchID(id, text, item.branchs);
    }, null);
  }

  async greetins(idChatInMemory: number) {
    for(const message of this.chatBot.greetings) {
			await this.sendMessageWhatsapp(this.activeChats[idChatInMemory].idSender, message);
    }
    this.activeChats[idChatInMemory].greetins = false;
    this.activeChats[idChatInMemory].lastBranch = null;
    this.activeChats[idChatInMemory].affirmation = false;
  }

  async menu(idChatInMemory: number){
		if(this.activeChats[idChatInMemory].updateUsername === false){
			this.resendGreeting(idChatInMemory)
			return
		}

    let i = 0;
    for(const branch of this.menuBranch.branchs) {
      if(branch.enabled === true) {
				await this.sendMessageWhatsapp(this.activeChats[idChatInMemory].idSender, `*${this.optionAvailable[i]})* - ${branch.text}`);
        i++;
      }
    }
    this.activeChats[idChatInMemory].greetins = false;
    this.activeChats[idChatInMemory].lastBranch = this.menuBranch.id;
    this.activeChats[idChatInMemory].affirmation = false;
  }

	async resendGreeting(idChatInMemory: number){
		this.activeChats[idChatInMemory].greetins = false;
		this.activeChats[idChatInMemory].lastBranch = null;
		this.activeChats[idChatInMemory].affirmation = false;
		this.activeChats[idChatInMemory].form = {
			active: true,
			activeQuestion: 0,
			questions: [
				{
					idChat: this.activeChats[idChatInMemory].idChat,
					message: "consultando rut",
					formConsulta: true,
					parrameter: "rutUser",
			}],
			socket: "consulta"
		}
		await this.sendMessageWhatsapp(this.activeChats[idChatInMemory].idSender, "favor ingrese su numero de rut y digito verificador");
	}

  async showAffirmation(idChatInMemory: number) {
    let i = 0;
    const afirmationBranch = this.chatBot.affirmation;
    for(const branch of afirmationBranch) {
      if(branch.enabled === true) {
				await this.sendMessageWhatsapp(this.activeChats[idChatInMemory].idSender, `*${this.optionAvailable[i]})* - ${branch.text}`);
        i++;
      }
    }
    this.activeChats[idChatInMemory].greetins = false;
    this.activeChats[idChatInMemory].lastBranch = null;
    this.activeChats[idChatInMemory].affirmation = true;
  }

  async sendDefaultMesagge(idChatInMemory: number){
		const handler = this.activeChats[idChatInMemory].updateUsername==true? this.chatBot.default: "No le entendemos. Le puedo ayudar en algo mas?"
		await this.sendMessageWhatsapp(this.activeChats[idChatInMemory].idSender, handler);
		if(this.activeChats[idChatInMemory].updateUsername==true)
			return this.menu(idChatInMemory)
		return this.showAffirmation(idChatInMemory)
  }

  private _splitPhone(whatsappId: string): string {
    return whatsappId.split('@')[0];
  }

  private async _activeChatWithAgent(idChatInMemory: number) {
		const response = await this.apiSinaptica.asignedAsesor(this.idEmpresa, this.activeChats[idChatInMemory].idUsername, this.activeChats[idChatInMemory].idChat)
		if(response.idAsesor >= 0){
			/** si es mayo que 0 tiene id de asesor */
			this.activeChats[idChatInMemory].asesorOnline = true;
			this.activeChats[idChatInMemory].idAsesor = response.idAsesor;
		}
		return await this.sendMessageWhatsapp(this.activeChats[idChatInMemory].idSender,  response.message)
  }

  private _desactiveChatWithAgent(idChatInMemory: number) {
    this.activeChats[idChatInMemory].asesorOnline = false;
    this.activeChats[idChatInMemory].greetins = true;
    this.activeChats[idChatInMemory].idAsesor = null;
  }

  _sendMessageToAgent(idChatInMemory: number, message: string) {
    const whatsapp = {
      time: new Date().toLocaleString(),
      message: message,
      ID_dest: this.activeChats[idChatInMemory].idAsesor,
      ID_emet: this.activeChats[idChatInMemory].idUsername,
      idChat: this.activeChats[idChatInMemory].idChat,
			whatsapp: false
    };
    this.socket.emit('whatsapp', whatsapp);
  }

  private async downloadAndDecryptMedia(message: Message) {
    return this.whatsapp.decryptFile(message).then(async buffer => {
      if(this.mimetypes!==null &&  !this.mimetypes.some(type => message.mimetype.startsWith(type))){
        message.clientUrl = '';
        return message;
      }

      const fileName = `${message.id}.${mime.extension(message.mimetype)}`;
      const filePath = path.resolve(`${this.FILES_FOLDER}/${fileName}`);
      await writeFileAsync(filePath, buffer);
      message.clientUrl = this.config.files_url + fileName;
      this.removeFile(filePath);
      return message;
    });
  }

  onApplicationShutdown(signal?: string): any {
    return this.whatsapp.close();
  }

  private removeFile(file: string) {
		setTimeout(() => {
			fs.unlink(file, () => {
				console.log(`File ${file} was removed`);
			})
		}, this.files_lifetime);
  }

  private clean_downloads() {
    if(fs.existsSync(this.FILES_FOLDER)) {
      del([`${this.FILES_FOLDER}/*`], { force: true }).then(paths =>{
				console.log('Deleted files and directories:\n', paths.join('\n'))
			});
    } else {
      fs.mkdirSync(this.FILES_FOLDER);
      console.log(`Directory '${this.FILES_FOLDER}' created from scratch`);
    }
  }
}
