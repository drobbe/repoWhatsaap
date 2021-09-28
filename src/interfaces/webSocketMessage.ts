export interface WebSocketMessage {
  id: number;
  time: string;
  idChat: number;
  message: string;
  buttonMenuOptions?: boolean;
  formConsulta?: boolean;
  formCompromiso?: boolean;

  whatsapp?: {
    socket: 'string';
    messages: [
      {
        idChat: number;
        message: string;
        formConsulta?: boolean;
        parrameter?: string;
      },
    ];
  };
}
