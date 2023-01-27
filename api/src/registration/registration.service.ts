import { Injectable, BadRequestException } from '@nestjs/common';
import { RegistrationRequestDto, RegistrationStatusDto } from '../types/registration.dto';
import { DbService } from '../db/db.service';
import { ApprovalStatus } from '../types/registration.db';
import { MailService } from '../mail-service';
import { ApiConfigService } from '../api-config';
import * as jwt from 'jsonwebtoken';
import { VerificationSignature } from './verification-signature';
import { ApprovalSignature } from './approval-signature';

@Injectable()
export class RegistrationService {

  constructor(
    private dbService: DbService,
    private mailService: MailService,
    private apiConfigService: ApiConfigService
  ) {
  }

  async register(
    registrationRequest: RegistrationRequestDto
  ) {
    const existingRegistration = await this.dbService.registrations.findOne({
      email: registrationRequest.email
    });

    if (existingRegistration) {
      throw new BadRequestException('Registration already exists for ' + registrationRequest.email);
    }

    const id = await this.dbService.registrations.insert({
      email: registrationRequest.email,
      status: ApprovalStatus.inProgress,
      name: registrationRequest.name,
      verified: false
    });

    const signature: VerificationSignature = { registrationId: id };
    const token = jwt.sign(signature, this.apiConfigService.jwtSigningSecret, {
      expiresIn: '1h'
    });
    const link = `${this.apiConfigService.nodeAddress}/api/verify?token=${token}`;
    await this.mailService.sendRegistrationVerification(registrationRequest.email, link);
  }

  private decodeVerificationToken(token: string): string {
    const signature = jwt.verify(token, this.apiConfigService.jwtSigningSecret) as VerificationSignature;
    return signature.registrationId;
  }

  async verify(token: string) {
    const registrationId = this.decodeVerificationToken(token);
    await this.dbService.registrations.update(registrationId, {
      verified: true
    });

    const registrationToApprove = await this.dbService.registrations.findOne({
      _id: registrationId
    });

    if (registrationToApprove.status === ApprovalStatus.approved) {
      throw new BadRequestException('Already approved');
    }

    const approverRegistrations = await this.dbService.registrations.find({
      status: ApprovalStatus.approved,
      _id: { $ne: registrationToApprove._id }
    });

    await this.dbService.approvals.insertMany(approverRegistrations.map(approverRegistration => ({
      approverEmail: approverRegistration.email,
      approverName: approverRegistration.name,
      approvalForRegistrationId: registrationToApprove._id,
      approverRegistrationId: approverRegistration._id,
      status: ApprovalStatus.inProgress
    })));

    const approvals = await this.dbService.approvals.find({
      approvalForRegistrationId: registrationToApprove._id
    });

    for (const approval of approvals) {
      const signature: ApprovalSignature = { approvalId: approval._id };
      const token = jwt.sign(signature, this.apiConfigService.jwtSigningSecret, {
        expiresIn: '1week'
      });
      const link = `${this.apiConfigService.nodeAddress}/api/approve?token=${token}`;
      await this.mailService.sendRegistrationApprovalRequest(approval.approverEmail, registrationToApprove, link);
    }
  }

  async approve(token: string, approved: boolean) {
    const signature = jwt.verify(token, this.apiConfigService.jwtSigningSecret) as ApprovalSignature;
    const approvalId = signature.approvalId;
    const approval = await this.dbService.approvals.findOne({ _id: approvalId });
    if (!approval) {
      throw new BadRequestException('Invalid Approval');
    }

    await this.dbService.approvals.update(approvalId, {
      status: approved ? ApprovalStatus.approved : ApprovalStatus.rejected
    });

    const approvals = await this.dbService.approvals.find({
      approvalForRegistrationId: approval.approvalForRegistrationId
    });

    if (approvals.filter(a => a.status === ApprovalStatus.rejected).length > 0) {
      await this.dbService.registrations.update(approval.approverRegistrationId, {
        status: ApprovalStatus.rejected
      });

      const registration = await this.dbService.registrations.get(approval.approvalForRegistrationId);
      await this.mailService.sendRegistrationUpdated(registration);
      return;
    }

    if (approvals.filter(a => a.status === ApprovalStatus.approved).length === approvals.length) {
      await this.dbService.registrations.update(approval.approvalForRegistrationId, {
        status: ApprovalStatus.approved
      });

      const registration = await this.dbService.registrations.get(approval.approvalForRegistrationId);
      await this.mailService.sendRegistrationUpdated(registration);
      return;
    }
  }

  async getStatus(token: string): Promise<RegistrationStatusDto> {
    const registrationId = this.decodeVerificationToken(token);
    const registration = await this.dbService.registrations.get(registrationId);
    const approvals = await this.dbService.approvals.find({
      approvalForRegistrationId: registrationId
    });
    return {
      status: registration.status,
      email: registration.email,
      name: registration.name,
      approvals: approvals.map(a => ({
        status: a.status,
        email: a.approverEmail,
        name: a.approverName
      }))
    };
  }

}