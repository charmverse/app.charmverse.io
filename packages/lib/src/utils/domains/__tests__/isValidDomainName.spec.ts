import { isValidDomainName } from '../isValidDomainName';

describe('isValidDomainName', () => {
  it('should validate top-level domain names', () => {
    expect(isValidDomainName('google.com')).toBe(true);
    expect(isValidDomainName('charmverse.io')).toBe(true);
    expect(isValidDomainName('example.xyz')).toBe(true);
    expect(isValidDomainName('123-value.com')).toBe(true);
  });

  it('should validate subdomain names', () => {
    expect(isValidDomainName('asd.google.com')).toBe(true);
    expect(isValidDomainName('asd.new-google.com')).toBe(true);
    expect(isValidDomainName('app.charmverse.io')).toBe(true);
    expect(isValidDomainName('qq.example.xyz')).toBe(true);
    expect(isValidDomainName('qwe.qq.example.xyz')).toBe(true);
    expect(isValidDomainName('qwe.0xcharmverse.xyz')).toBe(true);
  });

  it('should not validate single-letter suffix / subdomain', () => {
    expect(isValidDomainName('a.google.com')).toBe(false);
    expect(isValidDomainName('app.chamrverse.i')).toBe(false);
    expect(isValidDomainName('app.s.com')).toBe(false);
  });

  it('should not validate domain with protocol or port', () => {
    expect(isValidDomainName('http://google.com')).toBe(false);
    expect(isValidDomainName('https://app.chamrverse.io')).toBe(false);
    expect(isValidDomainName('app.charmverse.io:3000')).toBe(false);
    expect(isValidDomainName('')).toBe(false);
    expect(isValidDomainName('app.')).toBe(false);
  });

  it('should not validate domain with incorrect characters', () => {
    expect(isValidDomainName('google.com/')).toBe(false);
    expect(isValidDomainName('google@.com')).toBe(false);
    expect(isValidDomainName('google-.com')).toBe(false);
    expect(isValidDomainName('-google.com')).toBe(false);
  });
});
