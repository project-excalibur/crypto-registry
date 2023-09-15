import { isValidZpub } from './is-valid-zpub';
import { exchangeMnemonic } from './exchange-mnemonic';
import { Bip84Utils } from './bip84-utils';

describe('is-valid-zpub', function () {
  test('valid', () => {
    const validZpub = Bip84Utils.zpubFromMnemonic(exchangeMnemonic);
    expect(isValidZpub(validZpub)).toBe(true);
  });

  test('invalid', () => {
    expect(isValidZpub('any string')).toBe(false);
  });
});
