import { log } from '@charmverse/core/log';

export function prettyPrint(input: any): string {
  const pretty =
    typeof input === 'object'
      ? JSON.stringify(input, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)
      : input.toString
      ? input.toString()
      : input;

  log.info(pretty);

  return pretty;
}
