export class ChatInMemory {
  idUsername: number;
  idChat: number;
  telefono: string;
  idSender: string;
  greetins: boolean;
  affirmation: boolean;
  lastBranch: number | null;
  queueMesage: number;
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

  constructor(chat) {
    this.idUsername = chat.idUsername;
    this.idChat = chat.idChat;
    this.telefono = chat.telefono;
    this.idSender = chat.idSender;
    this.greetins = true;
    this.affirmation = false;
    this.lastBranch = null;
    this.queueMesage = 0;
    this.form = {
      active: false,
    };
  }
}
