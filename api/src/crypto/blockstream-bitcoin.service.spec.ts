import { BitcoinService } from './bitcoin.service';
import { TestLoggerService } from "../utils/logging";
import { Network } from '@bcr/types';
import { BlockstreamBitcoinService } from './blockstream-bitcoin.service';
import { isTxSenderFromWallet } from './is-tx-sender-from-wallet';
import { Bip84Utils } from './bip84-utils';
import { exchangeMnemonic, registryMnemonic } from './exchange-mnemonic';

jest.setTimeout(100000);

describe('blockstream-bitcoin-service', () => {
  let service: BitcoinService;
  const registryAddress1 = 'tb1qhkpu4e5pyy438hlfah0gq3gm22hgzr7lak6hwx';
  const txid = '5f8f5a1eae91e168d1c8c8e98709435d9b8a1e4757f780091fadcb6870cbf517';
  let exchangeZpub: string;

  beforeEach(async () => {
    exchangeZpub = Bip84Utils.zpubFromMnemonic(exchangeMnemonic);
    service = new BlockstreamBitcoinService(Network.testnet, new TestLoggerService());
  });

  test('get balance', async () => {
    expect(await service.getAddressBalance(registryAddress1)).toBe(10000);
  });

  test('get exchange input balance', async () => {
    const txs = await service.getTransactionsForAddress(registryAddress1);
    expect(txs[0].inputValue).toBe(976616);
    expect(isTxSenderFromWallet(service, txs[0], exchangeZpub)).toBe(true);
  });

  test('get tx for address', async () => {
    const txs = await service.getTransactionsForAddress('tb1qwkelsl53gyucj9u56zmldk6qcuqqgvgm0nc92u');
    console.log(JSON.stringify(txs, null, 2))
  });

  test('check sender is from exchange', async () => {
    const txs = await service.getTransactionsForAddress(registryAddress1);
    expect(isTxSenderFromWallet(service, txs[0], exchangeZpub)).toBe(true);
  });

  test('get transaction', async () => {
    const tx = await service.getTransaction(txid);
    expect(tx.inputValue).toBe(976616);
  });

  test('get test exchange wallet balance', async () => {
    const zpub = Bip84Utils.zpubFromMnemonic(exchangeMnemonic);
    const timerId = 'exchange wallet balance';
    console.time(timerId)
    const walletBalance = await service.getWalletBalance(zpub);
    console.timeEnd(timerId)
    expect(walletBalance).toBe(1909300);
  });

  test('get test registry wallet balance', async () => {
    const zpub = Bip84Utils.zpubFromMnemonic(registryMnemonic);
    const timerId = 'registry wallet balance';
    console.time(timerId)
    const walletBalance = await service.getWalletBalance(zpub);
    console.timeEnd(timerId)
    expect(walletBalance).toBe(474501);
  });

});
