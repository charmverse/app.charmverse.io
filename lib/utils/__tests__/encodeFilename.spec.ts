import { encodeFilename } from '../encodeFilename';

describe('encoding filename', () => {
  it('should escape unsafe characters', () => {
    const formatted = encodeFilename('foo@bar.png');

    expect(formatted).toBe('foo%40bar.png');
  });

  it('should work with a period in the file name', () => {
    const formatted = encodeFilename('foo.bar.png');

    expect(formatted).toBe('foo.bar.png');
  });
});
