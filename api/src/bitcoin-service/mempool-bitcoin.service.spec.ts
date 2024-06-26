import { BitcoinService } from './bitcoin.service';
import { Bip84Utils, exchangeMnemonic, isTxSenderFromWallet } from '../crypto';
import { Network } from '@bcr/types';
import { MempoolBitcoinService } from './mempool-bitcoin.service';

jest.setTimeout(10000000);

describe.skip('mempool-bitcoin-service', () => {
  let service: BitcoinService;
  const registryAddress1 = 'tb1qhkpu4e5pyy438hlfah0gq3gm22hgzr7lak6hwx';
  const txid = '5f8f5a1eae91e168d1c8c8e98709435d9b8a1e4757f780091fadcb6870cbf517';
  const exchangeZpub = Bip84Utils.extendedPublicKeyFromMnemonic(exchangeMnemonic, Network.testnet, 'vpub');
  // const registryZpub = Bip84Account.zpubFromMnemonic(registryMnemonic);

  // eslint-disable-next-line
  const simonsZpub = 'vpub5ZoiA74btTko95S4iofUVbmFNgfoDFFBZ7MTxiNGFQfwHvJcuqGwsVz2fUgUkBqmgDDVgpBAxHt7Y7aKYczzQ2PXJzKSM2qA3vqanHsAWut';
  const simon2Zpub = 'vpub5VQo2D8FiCNgQcwBYPfgAVAW2FQ7QQViFLPuRb1SLQxEfBTFSJJgGUUkfiPF8r33HKdB4pQM9gKjoK4P8sPWfQGKxU87Mmih2acWSdJjmR3';

  beforeEach(async () => {
    service = new MempoolBitcoinService(Network.testnet);
  });

  test('get balance', async () => {
    expect(await service.getAddressBalance(registryAddress1)).toBe(10000);
  });

  test('get exchange input balance', async () => {
    const txs = await service.getTransactionsForAddress(registryAddress1);
    expect(txs[0].inputValue).toBe(976616);
    expect(isTxSenderFromWallet(txs[0], exchangeZpub)).toBe(true);
  });

  test('check sender is from exchange', async () => {
    const txs = await service.getTransactionsForAddress(registryAddress1);
    expect(isTxSenderFromWallet(txs[0], exchangeZpub)).toBe(true);
  });

  test('get transaction', async () => {
    const tx = await service.getTransaction(txid);
    expect(tx.inputValue).toBe(976616);
  });

  test('get wallet balance', async () => {
    expect(await service.getWalletBalance(simon2Zpub)).toBe(9800);
  });
});
