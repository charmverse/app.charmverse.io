// Type definitions for nanoid-dictionary 4.3
// Project: https://github.com/CyberAP/nanoid-dictionary#readme

declare module 'nanoid-dictionary' {
  export const lowercase: string;
  export const uppercase: string;
  export const alphanumeric: string;
  export const numbers: string;
  export const nolookalikes: string;
  // not supported in v3 - update when v5 is released (which supports commonjs modules)
  // export const nolookalikesSafe: string;
  // export const hexadecimalLowercase: string;
  // export const hexadecimalUppercase: string;
}
