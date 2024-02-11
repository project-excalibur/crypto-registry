import { Injectable } from '@nestjs/common';
import { RegistrationRecord } from '../types/registration.types';
import { SendMailService } from './send-mail-service';
import { VerifiedHoldings } from '@bcr/types';
import { render } from '@react-email/render';
import { VerificationEmail } from './components/verification-email';

@Injectable()
export class MailService {
  constructor(private sendMailService: SendMailService) {
  }

  async sendTestEmail(toEmail: string, name: string) {
    await this.sendMailService.sendMail({
      to: toEmail,
      subject: 'BCR Test Email',
      template: './test-email',
      context: {
        email: toEmail,
        name: name
      }
    });
  }

  async sendVerificationEmail(
    toEmail: string,
    verifiedHoldings: VerifiedHoldings[],
    institutionName: string
  ) {

    const html = render(VerificationEmail({
      toEmail, verifiedHoldings, institutionName
    }));

    await this.sendMailService.sendMail({
      to: toEmail,
      subject: 'Customer Balances Verification',
      html: html
    });
  }

  async sendRegistrationVerification(
    toEmail: string,
    link: string
  ) {
    await this.sendMailService.sendMail({
      to: toEmail,
      subject: 'Exchange Registration Request',
      template: './verify-email',
      context: {toEmail, link}
    });
  }

  async sendUserVerification(
    toEmail: string,
    link: string
  ) {
    await this.sendMailService.sendMail({
      to: toEmail,
      subject: 'User Verification',
      template: './verify-user-email',
      context: {toEmail, link}
    });
  }

  async sendResetPasswordEmail(
    toEmail: string,
    link: string
  ) {
    await this.sendMailService.sendMail({
      to: toEmail,
      subject: 'Password Reset',
      template: './reset-password',
      context: {toEmail, link}
    });
  }

  async sendRegistrationApprovalRequest(
    approverEmail: string,
    registrationToApprove: RegistrationRecord,
    approvalLink: string
  ) {
    await this.sendMailService.sendMail({
      to: approverEmail,
      subject: 'Registration Approval Request',
      template: './registration-approval-request',
      context: {
        toEmail: approverEmail,
        link: approvalLink,
        exchangeName: registrationToApprove.institutionName,
        registrationEmail: registrationToApprove.email
      }
    });
  }

  async sendRegistrationUpdated(
    registration: RegistrationRecord
  ) {
    await this.sendMailService.sendMail({
      to: registration.email,
      subject: 'Registration Updated',
      template: './registration-updated',
      context: {registration}
    });
  }
}
