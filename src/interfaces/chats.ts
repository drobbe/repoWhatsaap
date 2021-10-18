export class ChatInMemory {
  idUsername: number;
  idChat: number;
  telefono: string;
	username: string;
  idSender: string;
  greetins: boolean;
  affirmation: boolean;
  lastBranch: number | null;
	updateUsername?: boolean;
  queueMesage: number;
  asesorOnline: boolean;
  idAsesor: number | null;
	userNotFound: boolean;
  form: {
    active: boolean;
    activeQuestion?: number;
    questions?: [
      {
        idChat: number;
        message: string;
        formConsulta?: boolean;
        parrameter?: string;
        value?: string;
      },
    ];
    socket?: string;
  };
	userNotFoundForm?: {
		indexProcess?: number;
		informations?: [
			{
				message: string,
				value: string,
				parrameter: string,
			}
		]
	}

  constructor(chat: any, telephone: string) {
    this.idUsername = chat.idUsername | chat.idUser;
    this.idChat = chat.idChat | chat.idChat;
    this.telefono = chat.telefono;
		this.username = chat.username;
    this.idSender = telephone;
    this.greetins = true;
    this.affirmation = false;
    this.lastBranch = null;
		this.updateUsername = false;
    this.queueMesage = 0;
    this.asesorOnline = false;
    this.idAsesor = null;
		this.userNotFound = false;
    this.form = {
      active: true,
			activeQuestion: 0,
			questions: [
				{
					idChat: chat.idChat,
					message: "consultando rut",
					formConsulta: true,
					parrameter: "rutUser",
				}
			],
			socket: "consulta"
    };
  }
}
