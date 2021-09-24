export interface WebSocketMessage {
  id: number;
  time: string;
  idChat: number;
  message: string;
  buttonMenuOptions?: boolean;
}
