import { Network } from '@bcr/types';
import { Bip84Utils, exchangeMnemonic } from '../crypto';
import { TestNode } from '../testing';

describe('bitcoin-controller', () => {
  let node: TestNode;
  const exchangeZpub = Bip84Utils.extendedPublicKeyFromMnemonic(exchangeMnemonic, Network.testnet, 'vpub');
  // const registryZpub = Bip84Account.zpubFromMnemonic(registryMnemonic);

  beforeEach(async () => {
    node = await TestNode.createTestNode(1, {
      resetMockWallet: true
    });
  });

  test('get balance', async () => {
    const balance = await node.bitcoinController.getWalletBalance(exchangeZpub, Network.testnet);
    expect(balance).toBe(30000000);
  });

  test('get txs for address', async () => {
    const address = node.bitcoinService.getAddress(exchangeZpub, 0, false);
    const txs = await node.bitcoinController.getTransactionsForAddress(address, Network.testnet);
    expect(txs.length).toBe(1);
    expect(txs[0].outputs[0].address).toBe(address);
  });
});