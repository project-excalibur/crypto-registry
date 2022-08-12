import { Module, Logger } from '@nestjs/common';
import * as path from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MongoService } from './db/mongo.service';
import { CustodianWalletController, CustodianWalletService } from './custodian-wallet';
import { CustomerHoldingController, CustomerHoldingService } from './customer-holding';
import { BlockChainService } from './block-chain/block-chain.service';
import { BlockChainController } from './block-chain/block-chain.controller';
import { ApiConfigService } from './api-config/api-config.service';
import { SystemController } from './system/system.controller';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'assets', 'api-docs'),
      serveRoot: '/docs'
    }),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', '..', 'client', 'build'),
      serveRoot: '/'
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.' + process.env.NODE_ENV
    }),
    MailModule
  ],
  controllers: [
    CustodianWalletController,
    CustomerHoldingController,
    BlockChainController,
    SystemController
  ],
  providers: [
    CustodianWalletService,
    CustomerHoldingService,
    BlockChainService,
    ApiConfigService,
    {
      provide: Logger,
      useFactory: () => {
        return new Logger('Default Logger');
      }
    }, {
      provide: MongoService,
      useFactory: async (
        configService: ApiConfigService
      ) => {
        const mongoService = new MongoService(configService);
        mongoService.connect()
          .then(() => {
            console.log('Mongo Connected');
          })
          .catch(() => {
            console.error('Mongo Failed to connect');
          });
        return mongoService;
      },
      inject: [ApiConfigService]
    }
  ]
})
export class AppModule {
}
