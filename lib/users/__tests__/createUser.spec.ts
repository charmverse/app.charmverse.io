import { createUserFromWallet } from '../createUser';

describe('createUserFromWallet', () => {
  it('should create the user with the lowercase version of their web3 address', async () => {
    const address = '0x7240CD336aD076dFF51383b155F8bb38bdB3c98a';

    const user = await createUserFromWallet(address);

    expect(user.wallets.length).toBe(1);
    expect(user.wallets[0].address).toBe(address.toLowerCase());
  });
});
