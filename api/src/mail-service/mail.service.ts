import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { IMailService, VerifiedHoldings } from './mail.service.interface';
import { satoshiInBitcoin } from '../utils';
import { ApiConfigService } from '../api-config';

@Injectable()
export class MailService implements IMailService {
  constructor(private mailerService: MailerService,
              private apiConfigService: ApiConfigService,
              private logger: Logger) {
  }

  async sendTestEmail(toEmail: string, name: string) {
    this.logger.log('Sending email', {
      toEmail,
      name
    });
    await this.mailerService.sendMail({
      to: toEmail,
      subject: 'BCR Test Email',
      template: './test-email',
      context: {
        email: toEmail,
        name: name
      }
    });
    return {
      status: 'ok'
    };
  }

  async sendVerificationEmail(
    toEmail: string,
    verifiedHoldings: VerifiedHoldings[]
  ) {
    if (!this.apiConfigService.isEmailEnabled) {
      this.logger.warn('Email is disabled', { verifiedHoldings, toEmail });
      return;
    }
    await this.mailerService.sendMail({
      to: toEmail,
      subject: 'Crypto Registry Verification',
      template: './verification',
      context: {
        toEmail: toEmail,
        verifiedHoldings: verifiedHoldings.map(holding => ({
          exchangeName: holding.exchangeName,
          customerHoldingAmount: holding.customerHoldingAmount / satoshiInBitcoin
        }))
      }
    });
  }
}
