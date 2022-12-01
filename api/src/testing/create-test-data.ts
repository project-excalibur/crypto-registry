import { ExchangeDbService } from '../exchange';
import { CustomerHoldingsDbService } from '../customer';
import { UserIdentity } from '@bcr/types';
import { ApiConfigService } from '../api-config/api-config.service';
import { ResetDataOptions } from '../types/reset-data-options-dto.type';

export interface TestData {
  customerEmail: string;
  exchangeId: string;
  exchangeName: string;
  customerHoldingId: string;
}

export const createTestData = async (
  exchangeDbService: ExchangeDbService,
  customerHoldingsDbService: CustomerHoldingsDbService,
  apiConfigService: ApiConfigService,
  options?: ResetDataOptions
): Promise<TestData> => {
  await exchangeDbService.deleteMany({}, { type: 'reset' });
  await customerHoldingsDbService.deleteMany({}, { type: 'reset' });

  const customerEmail = 'rob@excal.tv';
  const exchangeName = 'Exchange-1';
  const exchangeIdentity: UserIdentity = { id: '1', type: 'exchange' };

  const exchange1Id = await exchangeDbService.insert(
    {
      currentBalance: apiConfigService.registrationCost,
      exchangeName: exchangeName,
      publicKey: 'exchange-1',
      totalCustomerHoldings: apiConfigService.registrationCost
    },
    exchangeIdentity
  );

  await exchangeDbService.insert(
    {
      currentBalance: 100,
      exchangeName: exchangeName,
      publicKey: 'exchange-2',
      totalCustomerHoldings: 200
    },
    exchangeIdentity
  );

  let customerHoldingId: string;
  if (options?.createHoldings) {
    customerHoldingId = await customerHoldingsDbService.insert(
      {
        amount: 1000,
        exchangeId: exchange1Id,
        hashedEmail: customerEmail
      },
      exchangeIdentity
    );
  }

  return {
    exchangeId: exchange1Id,
    customerEmail: customerEmail,
    customerHoldingId: customerHoldingId,
    exchangeName: exchangeName
  };
};
