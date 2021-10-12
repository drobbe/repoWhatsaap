import { Controller, Body,  Get, Post, Inject, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Whatsapp } from 'venom-bot';
import { Readable } from 'stream';
import { Response } from 'express';


import { MessageText } from './all.dto';
@Controller('api')
@ApiTags('screenshot')
export class ScreenshotController {
  constructor(@Inject('WHATSAPP') private whatsapp: Whatsapp) {}

  @Get('/screenshot')
  async screenshot(@Res() res: Response) {
    const buffer = await this.whatsapp.page.screenshot();
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
    });
    stream.pipe(res);
  }

	@Post('/sendText')
  @ApiOperation({ summary: 'Send a text message' })
  sendText(@Body() message: MessageText) {
    return this.whatsapp.sendText(message.chatId, message.text);
  }
}
