import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { CustodianBase, CustomerHolding, CustomerHoldingRecord, CustodianRecord } from '@bcr/types';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendTestEmail(toEmail: string, name: string) {
    await this.mailerService.sendMail({
      to: toEmail,
      subject: 'BCR Test Email',
      template: './test-email',
      context: {
        email: toEmail,
        name: name,
      },
    });
  }

  async sendVerificationEmail(
    toEmail: string,
    custodianWallet: CustodianRecord,
    customerHolding: CustomerHoldingRecord
    ) {
    await this.mailerService.sendMail({
      to: toEmail,
      subject: 'Bitcoin Registry Verification',
      template: './verification',
      context: {
        toEmail: toEmail,
        customerHoldingAmount: customerHolding.amount,
        custodianName: custodianWallet.custodianName
      },
    });
  }


}
