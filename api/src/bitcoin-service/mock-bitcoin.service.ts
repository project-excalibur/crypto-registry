import { DbService } from '../db/db.service';
import { Logger } from '@nestjs/common';
import { BitcoinCoreBlock, Network, Transaction } from '@bcr/types';
import { AxiosError } from 'axios';
import { MockBitcoinCoreApi } from '../bitcoin-core-api/mock-bitcoin-core-api';
import { AbstractBitcoinService } from './abstract-bitcoin.service';

export class MockBitcoinService extends AbstractBitcoinService {
  nextRequestStatusCode: number | null = null;
  mockBitcoinCoreApi = new MockBitcoinCoreApi();

  constructor(
    private dbService: DbService,
  ) {
    super(new Logger(MockBitcoinService.name), Network.testnet, 'mock');
  }

  setNextRequestStatusCode(code: number) {
    this.nextRequestStatusCode = code;
  }

  private checkNextRequestStatusCode() {
    if (this.nextRequestStatusCode) {
      const code = this.nextRequestStatusCode;
      this.nextRequestStatusCode = null;
      throw new AxiosError(`mock ${code} error`, code.toString());
    }
  }

  async testService(): Promise<number> {
    return 100;
  }

  async getAddressBalance(address: string): Promise<number> {
    this.checkNextRequestStatusCode();
    const addressData = await this.dbService.mockAddresses.findOne({
      address: address
    });
    return addressData?.balance ?? 0;
  }

  async getAddressBalances(addresses: string[]): Promise<Map<string, number>> {
    this.checkNextRequestStatusCode();
    const addressData = await this.dbService.mockAddresses.find({
      address: { $in: addresses }
    });
    const ret = new Map<string, number>();
    for (const address of addressData) {
      ret.set(address.address, address.balance);
    }
    return ret;
  }

  getTransaction(txid: string): Promise<Transaction> {
    return this.dbService.mockTransactions.findOne({txid});
  }

  async getTransactionsForAddress(address: string): Promise<Transaction[]> { // eslint-disable-line
    const txs = await this.dbService.mockTransactions.find({});
    return txs.filter(tx => {
      const inSide = tx.inputs.filter(input => input.address === address);
      if (inSide.length > 0) {
        return true;
      }
      const outSide = tx.outputs.filter(input => input.address === address);
      if (outSide.length) {
        return true;
      }
    });
  }

  getLatestBlock(): Promise<string> {
    return this.mockBitcoinCoreApi.getBestBlockHash();
  }

  getBlockDetails(blockHash: string): Promise<BitcoinCoreBlock> {
    return this.mockBitcoinCoreApi.getBlockDetail(blockHash);
  }

}
