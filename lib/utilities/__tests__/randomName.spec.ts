import { colors, animals } from 'unique-names-generator';
import { v4 } from 'uuid';

import { deterministicRandomName } from '../randomName';

describe('deterministicRandomName', () => {
  it('should always return the same name for the same input, consisting of a colour and an animal, with each first letter uppercase', () => {
    const seedInput = v4();

    const name = deterministicRandomName(seedInput);
    const splitted = name.split(' ');
    const [colour, animal] = splitted;

    // First part uppercase, rest lower case
    expect(colour.charAt(0)).toMatch(colour.charAt(0).toUpperCase());
    expect(colour.slice(1)).toMatch(colour.slice(1).toLowerCase());

    expect(animal.charAt(0)).toMatch(animal.charAt(0).toUpperCase());
    expect(animal.slice(1)).toMatch(animal.slice(1).toLowerCase());
    // Make sure we have correct colours and animals
    expect(colors.includes(colour.toLowerCase())).toBe(true);
    expect(animals.includes(animal.toLowerCase())).toBe(true);

    // Run this function multiple times to make sure it's deterministic
    expect(deterministicRandomName(seedInput)).toBe(name);
    expect(deterministicRandomName(seedInput)).toBe(name);
  });
});
