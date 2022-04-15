export interface UnsupportedKeysError<E = any> {
  error: string
  unsupportedKeys: string [],
  allowedKeys: string [],
  example: E
}
