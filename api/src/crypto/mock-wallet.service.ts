import { UserIdentity } from '@bcr/types';
import { minimumBitcoinPaymentInSatoshi } from '../utils';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { generateAddress } from './generate-address';
import { WalletService } from './wallet.service';
import { v4 as uuidv4 } from 'uuid';
import { TransactionInput } from './bitcoin.service';
import { DbService } from '../db/db.service';

@Injectable()
export class MockWalletService extends WalletService {
  private logger = new Logger(MockWalletService.name)

  constructor(
    private dbService: DbService,
  ) {
    super();
  }

  async sendFunds(
    senderZpub: string,
    toAddress: string,
    amount: number) {
    this.logger.log('send funds', { senderZpub, toAddress, amount });

    const identity: UserIdentity = { type: 'test' };
    if (amount < minimumBitcoinPaymentInSatoshi) {
      throw new BadRequestException('Amount is lower than minimum bitcoin amount');
    }

    const senderUnspent = await this.dbService.mockAddresses.find({
      zpub: senderZpub,
      unspent: true
    });

    const senderBalance = senderUnspent.reduce((t, tx) => t + tx.balance, 0);

    if (senderBalance < amount) {
      throw new BadRequestException('Insufficient funds');
    }

    const txid = uuidv4();
    const inputs: TransactionInput[] = [];
    let spentAmount = 0;
    for (const unspent of senderUnspent)
      if (spentAmount < amount) {
        inputs.push({
          address: unspent.address,
          txid: txid,
          value: unspent.balance
        })
        await this.dbService.mockAddresses.update(unspent._id, {
          unspent: false
        }, identity);
        spentAmount += unspent.balance;
      } else {
        break;
      }

    // generate change address
    const existingChangeAddresses = await this.dbService.mockAddresses.count({
      zpub: senderZpub,
      forChange: true
    });

    const changeAddress = generateAddress(senderZpub, existingChangeAddresses, true);
    await this.dbService.mockAddresses.insert({
      walletName: senderUnspent[0].walletName,
      forChange: true,
      balance: spentAmount - amount,
      address: changeAddress,
      zpub: senderZpub,
      unspent: true
    }, identity);

    const toAddressRecord = await this.dbService.mockAddresses.findOne({
      address: toAddress
    });

    if (toAddressRecord) {
      await this.dbService.mockAddresses.update(toAddressRecord._id, {
        balance: toAddressRecord.balance + amount
      }, identity);
    } else {
      throw new BadRequestException('Receiving address does not exist');
    }

    await this.dbService.mockTransactions.insert({
      txid: txid,
      fee: 150,
      inputs: inputs,
      outputs: [{
        address: toAddress,
        value: amount
      }, {
        address: changeAddress,
        value: senderBalance - amount
      }],
      blockTime: new Date(),
      inputValue: amount
    }, identity)
  }

  async getReceivingAddress(
    receiverZpub: string,
    receiverName: string
  ): Promise<string> {
    const existingReceiverAddresses = await this.dbService.mockAddresses.count({
      zpub: receiverZpub,
      forChange: false
    });
    const receivingAddress = generateAddress(receiverZpub, existingReceiverAddresses, false);
    await this.dbService.mockAddresses.insert({
      walletName: receiverName,
      forChange: false,
      balance: 0,
      address: receivingAddress,
      zpub: receiverZpub,
      unspent: true
    }, { type: 'test' });
    return receivingAddress;
  }
}