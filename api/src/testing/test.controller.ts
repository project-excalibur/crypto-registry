import { BadRequestException, Body, Controller, Get, Post, Logger, UseGuards } from '@nestjs/common';
import { createTestData } from './create-test-data';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { SendFundsDto, SendTestEmailDto } from '@bcr/types';
import { MailService } from '../mail-service';
import { ApiConfigService } from '../api-config';
import { SubmissionService } from '../submission';
import { WalletService } from '../crypto/wallet.service';
import { DbService } from '../db/db.service';
import { MessageSenderService } from '../network/message-sender.service';
import { IsSignedInGuard } from '../user/is-signed-in.guard';

@Controller('test')
@ApiTags('test')
export class TestController {
  constructor(
    private db: DbService,
    private mailService: MailService,
    private apiConfigService: ApiConfigService,
    private submissionService: SubmissionService,
    private walletService: WalletService,
    private loggerService: Logger,
    private messageSenderService: MessageSenderService
  ) {
  }

  @Get('reset')
  async resetDb() {
    await createTestData(
      this.db,
      this.apiConfigService,
      this.submissionService,
      this.walletService,
      this.messageSenderService
    );
    this.loggerService.log('Reset');
    return {
      status: 'ok'
    };
  }

  @Post('send-test-email')
  @ApiBody({ type: SendTestEmailDto })
  async sendTestEmail(@Body() body: SendTestEmailDto) {
    try {
      await this.mailService.sendTestEmail(body.email, 'Rob');
    } catch (err) {
      this.loggerService.error(err);
      throw new BadRequestException(err.message);
    }
  }

  @Post('send-test-verification-email')
  @ApiBody({ type: SendTestEmailDto })
  async sendTestVerificationEmail(@Body() body: SendTestEmailDto) {
    try {
      await this.mailService.sendVerificationEmail(body.email, [{
        customerHoldingAmount: 22276400,
        exchangeName: 'Binance'
      }], this.apiConfigService.nodeName, this.apiConfigService.nodeAddress);
    } catch (err) {
      this.loggerService.error(err);
      throw new BadRequestException(err.message);
    }
  }

  @Post('send-funds')
  @ApiBody({ type: SendFundsDto })
  async sendFunds(
    @Body() body: SendFundsDto
  ) {
    await this.walletService.sendFunds(body.senderZpub, body.toAddress, body.amount);
    return {
      status: 'success'
    };
  }

  @Get('guarded-route')
  @UseGuards(IsSignedInGuard)
  async getGuardedRoute() {
    return {
      status: 'ok'
    }
  }
}
