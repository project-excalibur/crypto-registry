import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiConfigService } from '../api-config';
import { CreateSubmissionDto, CustomerHolding, SubmissionStatus, SubmissionStatusDto } from '@bcr/types';
import { submissionStatusRecordToDto } from './submission-record-to-dto';
import { minimumBitcoinPaymentInSatoshi } from '../utils';
import { WalletService } from '../crypto/wallet.service';
import { isTxsSendersFromWallet } from '../crypto/is-tx-sender-from-wallet';
import { DbService } from '../db/db.service';
import { BitcoinServiceFactory } from '../crypto/bitcoin-service-factory';

@Injectable()
export class SubmissionService {
  constructor(
    private db: DbService,
    private bitcoinServiceFactory: BitcoinServiceFactory,
    private apiConfigService: ApiConfigService,
    private walletService: WalletService
  ) {
  }

  async getSubmissionStatus(
    paymentAddress: string
  ): Promise<SubmissionStatusDto> {
    const submission = await this.db.submissions.findOne({
      paymentAddress
    });
    if (!submission) {
      throw new BadRequestException('Invalid Address');
    }

    if (submission.status === SubmissionStatus.VERIFIED
      || submission.status === SubmissionStatus.CANCELLED
    ) {
      return submissionStatusRecordToDto(submission);
    }

    const bitcoinService = this.bitcoinServiceFactory.getService(submission.network);
    const addressBalance = await bitcoinService.getAddressBalance(paymentAddress);
    if (addressBalance >= submission.paymentAmount) {
      const txs = await bitcoinService.getTransactionsForAddress(paymentAddress);
      const totalExchangeFunds = await bitcoinService.getWalletBalance(submission.exchangeZpub);
      let finalStatus = totalExchangeFunds >= (submission.totalCustomerFunds * this.apiConfigService.reserveLimit) ? SubmissionStatus.VERIFIED : SubmissionStatus.INSUFFICIENT_FUNDS;
      if (!isTxsSendersFromWallet(txs, submission.exchangeZpub)) {
        finalStatus = SubmissionStatus.SENDER_MISMATCH;
      }

      await this.db.submissions.update(
        submission._id, {
          status: finalStatus,
          totalExchangeFunds: totalExchangeFunds
        });

      return submissionStatusRecordToDto({
        ...submission,
        status: finalStatus,
        totalExchangeFunds: totalExchangeFunds
      });

    } else {
      return submissionStatusRecordToDto(submission);
    }
  }

  async cancel(address: string) {
    await this.db.submissions.findOneAndUpdate({
      paymentAddress: address
    }, {
      status: SubmissionStatus.CANCELLED
    });
  }

  async createSubmission(
    submission: CreateSubmissionDto
  ): Promise<SubmissionStatusDto> {
    const bitcoinService = this.bitcoinServiceFactory.getService(submission.network);

    bitcoinService.validateZPub(submission.exchangeZpub);

    const totalExchangeFunds = await bitcoinService.getWalletBalance(submission.exchangeZpub);
    if (totalExchangeFunds === 0) {
      throw new BadRequestException('Exchange Wallet Balance is zero');
    }

    const totalCustomerFunds = submission.customerHoldings.reduce((amount, holding) => amount + holding.amount, 0);
    const paymentAmount = Math.max(totalCustomerFunds * this.apiConfigService.paymentPercentage, minimumBitcoinPaymentInSatoshi);

    let paymentAddress: string = submission.paymentAddress;
    if (!submission.paymentAddress) {
      paymentAddress = await this.walletService.getReceivingAddress(this.apiConfigService.getRegistryZpub(submission.network), 'Registry');
    }

    const currentSubmission = await this.db.submissions.findOne({
      exchangeZpub: submission.exchangeZpub,
      isCurrent: true
    });

    if (currentSubmission) {
      await this.db.submissions.updateMany({
        _id: currentSubmission._id
      }, {
        isCurrent: false
      });

      await this.db.customerHoldings.updateMany({
        paymentAddress: currentSubmission.paymentAddress
      }, {
        isCurrent: false
      });
    }

    await this.db.submissions.insert({
      paymentAddress: paymentAddress,
      network: submission.network,
      paymentAmount: paymentAmount,
      totalCustomerFunds: totalCustomerFunds,
      totalExchangeFunds: totalExchangeFunds,
      status: SubmissionStatus.WAITING_FOR_PAYMENT,
      exchangeName: submission.exchangeName,
      exchangeZpub: submission.exchangeZpub,
      isCurrent: true
    });

    const inserts: CustomerHolding[] =
      submission.customerHoldings.map((holding) => ({
        hashedEmail: holding.hashedEmail.toLowerCase(),
        amount: holding.amount,
        paymentAddress: paymentAddress,
        isCurrent: true
      }));

    await this.db.customerHoldings.insertMany(inserts);

    return {
      paymentAddress: paymentAddress,
      network: submission.network,
      paymentAmount: paymentAmount,
      totalCustomerFunds: totalCustomerFunds,
      totalExchangeFunds: totalExchangeFunds,
      status: SubmissionStatus.WAITING_FOR_PAYMENT,
      exchangeName: submission.exchangeName,
      isCurrent: true
    };
  }
}
