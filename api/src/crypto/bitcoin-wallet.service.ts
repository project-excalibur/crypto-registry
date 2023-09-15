import { WalletService } from './wallet.service';
import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { Bip84Utils } from "./bip84-utils";
import { wait } from "../utils";
import { WalletAddress } from "../types/wallet-address-db.types";
import { BitcoinServiceFactory } from "./bitcoin-service-factory";
import { getNetworkForZpub } from "./get-network-for-zpub";

@Injectable()
export class BitcoinWalletService extends WalletService {

  constructor(
    protected db: DbService,
    private logger: Logger,
    protected bitcoinServiceFactory: BitcoinServiceFactory,
  ) {
    super();
  }

  async getReceivingAddress(
    receiverZpub: string
  ): Promise<WalletAddress> {
    const network = getNetworkForZpub(receiverZpub);
    const currentCount = await this.db.walletAddresses.count({
      zpub: receiverZpub,
      network: network
    });
    this.logger.log('get receiving address', {
      receiverZpub, currentCount, network
    });
    const bitcoinService = this.bitcoinServiceFactory.getService(network);
    const address = bitcoinService.getAddressGenerator(receiverZpub).getAddress(currentCount, false);
    await this.db.walletAddresses.insert({
      index: currentCount,
      address: address, zpub: receiverZpub, network
    });
    return {address, network, zpub: receiverZpub, index: currentCount};
  }

  sendFunds(senderZpub: string, toAddress: string, amount: number): Promise<void> { // eslint-disable-line
    return Promise.reject('Not implemented');
  }

  async storeReceivingAddress(
    receivingAddress: WalletAddress
  ) {
    const existingAddress = await this.db.walletAddresses.findOne({
      address: receivingAddress.address
    });

    if (existingAddress) {
      this.logger.warn('receiving address already stored', {
        receivingAddress
      });
      return;
    }

    await this.db.walletAddresses.insert({
      address: receivingAddress.address,
      zpub: receivingAddress.zpub,
      network: receivingAddress.network,
      index: receivingAddress.index
    });
  }

  async getAddressCount(
    zpub: string,
  ): Promise<number> {
    const network = getNetworkForZpub(zpub);
    return await this.db.walletAddresses.count({zpub, network});
  }

  async resetHistory(
    zpub: string,
    waitBetweenCalls = true
  ): Promise<void> {
    const network = getNetworkForZpub(zpub)
    const bitcoinService = this.bitcoinServiceFactory.getService(network);
    await this.db.walletAddresses.deleteMany({network: {$exists: false}});
    await this.db.walletAddresses.deleteMany({network});
    const account = new Bip84Utils(zpub);

    let zeroTxAddresses = 0;
    let addressIndex = 0;
    while (zeroTxAddresses < 20) {
      const address = account.getAddress(addressIndex, false);
      const txs = await bitcoinService.getTransactionsForAddress(address);
      if (txs.length === 0) {
        zeroTxAddresses++;
      } else {
        zeroTxAddresses = 0;
      }
      if (waitBetweenCalls) {
        // todo - could we use a back-off on 429?
        // await wait(1000);
      }
      addressIndex++;
    }

    const usedAddresses: WalletAddress [] = [];
    for (let index = 0; index < Math.max(0, addressIndex - 20); index++) {
      const address = account.getAddress(index, false);
      usedAddresses.push({
        zpub: zpub,
        address: address,
        network: network,
        index: index
      });
    }

    if (usedAddresses.length > 0) {
      await this.db.walletAddresses.insertMany(usedAddresses);
    }
  }
}
