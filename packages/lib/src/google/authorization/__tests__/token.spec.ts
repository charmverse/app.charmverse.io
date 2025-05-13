import { encryptToken, decryptToken } from '../token';

describe('Token encryption', () => {
  const token = 'my very lucky token';
  let encryptedToken: string;

  it('should encrypt a token without throwing an error', () => {
    encryptedToken = encryptToken(token);
    expect(encryptedToken).not.toEqual(token);
  });

  it('should throw an error when trying to re-encrypt a token', () => {
    expect(() => encryptToken(encryptedToken)).toThrowError('Token is already encrypted');
  });

  it('should decrypt a token correctly', () => {
    expect(decryptToken(encryptedToken)).toEqual(token);
  });
});
