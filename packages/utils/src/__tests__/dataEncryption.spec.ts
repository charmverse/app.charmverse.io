import { v4 } from 'uuid';

import { decryptData, encryptData } from '../dataEncryption';

jest.mock('config/constants', () => ({
  authSecret: 'testsecret1234567890'
}));

describe('date encryptio and decryption', () => {
  it('should encrypt and decrypt string data', () => {
    const data = v4();
    const encryptedData = encryptData(data);
    const decryptedData = decryptData(encryptedData);

    expect(decryptedData).toBe(data);
  });
  it('should encrypt and decrypt object data', () => {
    const data = { someProp: 'someValue' };

    const encryptedData = encryptData(data);
    const decryptedData = decryptData(encryptedData);

    expect(decryptedData).toEqual(data);
  });

  it('should encrypt and decrypt numeric data', () => {
    const data = 1337;

    const encryptedData = encryptData(data);
    const decryptedData = decryptData(encryptedData);

    expect(decryptedData).toBe(data);
  });
});
