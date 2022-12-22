import { Test } from '@nestjs/testing';
import { CustomerController } from '../customer';
import { BitcoinService, MockBitcoinService } from '../crypto';
import { ApiConfigService } from '../api-config';
import { MongoService } from '../db';
import { TestingModule } from '@nestjs/testing/testing-module';
import { MailService } from '../mail-service';
import { MockMailService } from '../mail-service/mock-mail-service';
import { Logger } from '@nestjs/common';
import { SubmissionController, SubmissionService } from '../submission';
import { MockWalletService } from '../crypto/mock-wallet.service';
import { getZpubFromMnemonic } from '../crypto/get-zpub-from-mnemonic';
import { registryMnemonic } from '../crypto/test-wallet-mnemonic';
import { WalletService } from '../crypto/wallet.service';
import { DbService } from '../db/db.service';

export const createTestModule = async (): Promise<TestingModule> => {

  const apiConfigService = {
    dbUrl: process.env.MONGO_URL,
    paymentPercentage: 0.01,
    isTestMode: true,
    hashingAlgorithm: 'simple',
    registryZpub: getZpubFromMnemonic(registryMnemonic, 'password', 'testnet'),
    reserveLimit: 0.9,
    logLevel: 'info',
    maxSubmissionAge: 7
  } as ApiConfigService;

  return await Test.createTestingModule({
    controllers: [
      SubmissionController,
      CustomerController
    ],
    providers: [
      MockWalletService,
      DbService,
      SubmissionService,
      Logger,
      MailService,
      {
        provide: ApiConfigService,
        useValue: apiConfigService
      },
      {
        provide: WalletService,
        useFactory: (dbService: DbService) => {
          return new MockWalletService(dbService);
        },
        inject: [DbService]
      },
      {
        provide: MailService,
        useClass: MockMailService
      },
      {
        provide: BitcoinService,
        useFactory: (dbService: DbService) => {
          return new MockBitcoinService(dbService);
        },
        inject: [DbService]
      },
      {
        provide: MongoService,
        useFactory: async (
          apiConfigService: ApiConfigService,
          logger: Logger
        ) => {
          const mongoService = new MongoService(apiConfigService);
          mongoService
            .connect()
            .then(() => {
              logger.log('Mongo Connected');
            })
            .catch(() => {
              logger.error('Mongo Failed to connect');
            });
          return mongoService;
        },
        inject: [ApiConfigService, Logger]
      }
    ]
  }).compile();
};
