import {ApiProperty} from "@nestjs/swagger";

const chatId = ApiProperty({
    example: '791231234567@c.us'
})
export class MessageText {
    @chatId
    chatId: string;
    text: string;
}