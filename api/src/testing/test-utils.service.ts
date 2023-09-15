import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { Network, ResetNodeOptions } from '@bcr/types';
import { createTestData } from './create-test-data';
import { ApiConfigService } from '../api-config';
import { WalletService } from '../crypto/wallet.service';
import { NodeService } from '../node';
import { resetNetwork } from './reset-network';

@Injectable()
export class TestUtilsService {

  constructor(
    private dbService: DbService,
    private apiConfigService: ApiConfigService,
    private walletService: WalletService,
    private nodeService: NodeService,
    private logger: Logger
  ) {
  }

  async resetNode(options: ResetNodeOptions): Promise<void> {
    this.logger.log('Reset node', options);
    let optionsToUse = {...options}
    if (optionsToUse.resetNetwork) {
      await resetNetwork(options.nodes, this.dbService,
        this.nodeService, options.emitResetNetwork,
        this.apiConfigService.nodeAddress,
        options.resetWallet,
        options.autoStart,
        this.logger);
      optionsToUse = {
        ...optionsToUse,
        resetChains: true,
      }
    }

    await createTestData(
      this.dbService, this.apiConfigService, this.walletService,
      this.nodeService, optionsToUse
    );

    await this.nodeService.emitNodes();
  }

  async resetWalletHistory(): Promise<void> {
    await this.walletService.resetHistory(this.apiConfigService.getRegistryZpub(Network.testnet), this.apiConfigService.bitcoinApi !== 'mock');
    // todo
    // await this.walletService.resetHistory(this.apiConfigService.getRegistryZpub(Network.mainnet), this.apiConfigService.bitcoinApi !== 'mock');
  }

}
