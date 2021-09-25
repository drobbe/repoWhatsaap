export interface ChatInMemory {
  idUsername: number;
  idChat: number;
  telefono: string;
  idSender: string;
  greetins: boolean;
  affirmation: boolean;
  lastBranch: number | null;
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
}
