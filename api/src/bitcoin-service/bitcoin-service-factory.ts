import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Network } from '@bcr/types';
import { ApiConfigService, BitcoinServiceType } from '../api-config';
import { MockBitcoinService } from './mock-bitcoin.service';
import { MempoolBitcoinService } from './mempool-bitcoin.service';
import { BlockstreamBitcoinService } from './blockstream-bitcoin.service';
import { ElectrumService } from '../electrum-api';
import { DbService } from '../db/db.service';
import { BitcoinService } from './bitcoin.service';

@Injectable()
export class BitcoinServiceFactory implements OnModuleDestroy {
  private readonly logger = new Logger(BitcoinServiceFactory.name);

  electrumTestNetService: ElectrumService;
  electrumMainNetService: ElectrumService;

  constructor(
    private apiConfigService: ApiConfigService,
    private dbService: DbService,
  ) {
  }

  getService(network: Network): BitcoinService {
    return this.getDefaultService(network, this.apiConfigService.bitcoinApi);
  }

  getDefaultService(network: Network, type: BitcoinServiceType): BitcoinService {
    if (type === 'mock') {
      return new MockBitcoinService(this.dbService);
    } else if (this.apiConfigService.bitcoinApi === 'mempool') {
      return new MempoolBitcoinService(network);
    } else if (type === 'blockstream') {
      return new BlockstreamBitcoinService(network);
    } else if (type === 'electrum-x') {
      if (network === Network.mainnet) {
        if (!this.electrumMainNetService) {
          this.electrumMainNetService = new ElectrumService(Network.mainnet, this.apiConfigService);
        }
        return this.electrumMainNetService;
      } else {
        if (!this.electrumTestNetService) {
          this.electrumTestNetService = new ElectrumService(Network.testnet, this.apiConfigService);
        }
        return this.electrumTestNetService;
      }
    } else {
      throw new Error('BitcoinServiceFactory: invalid config');
    }
  }

  onModuleDestroy(): any {
    if (this.electrumTestNetService) {
      this.electrumTestNetService.destroy();
    }
    if (this.electrumMainNetService) {
      this.electrumMainNetService.destroy();
    }
  }
}
