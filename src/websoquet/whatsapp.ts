import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server;
  users: number = 0;

  async handleConnection() {
    // A client has connected
    this.users++;
    // Notify connected clients of current users
		console.log("--------------------------------------------------")
		console.log("-------------- whatsapp connect ------------------")
		console.log("--------------------------------------------------")
    this.server.emit('users', this.users);
  }

  async handleDisconnect() {
    // A client has disconnected
    this.users--;
    // Notify connected clients of current users
    this.server.emit('users', this.users);
  }

  @SubscribeMessage('rosario')
  async onChat(client, message) {
		console.log
    client.broadcast.emit('rosario', message);
  }

	@SubscribeMessage('chat')
  async onRecivedWhatsap(client, message) {
    client.broadcast.emit('chat', message);
  }
}