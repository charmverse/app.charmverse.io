import type { ValidateFramesMessageOutput } from '@airstack/frames';
import { POST } from '@packages/adapters/http';
import { log } from '@packages/core/log';

export function hexStringToUint8Array(hexstring: string): Uint8Array {
  return new Uint8Array(hexstring.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)));
}

export function validateFrameInteractionViaAirstack(messageBytes: string): Promise<ValidateFramesMessageOutput> {
  const apiEndpoint = 'https://hubs.airstack.xyz/v1/validateMessage';

  return POST<ValidateFramesMessageOutput>(apiEndpoint, hexStringToUint8Array(messageBytes), {
    skipStringifying: true,
    headers: {
      'Content-Type': 'application/octet-stream',
      'x-airstack-hubs': process.env.AIRSTACK_API_KEY as string
    }
  });
}

export async function validateFrameInteractionViaAirstackWithErrorCatching(
  messageBytes: string
): Promise<ValidateFramesMessageOutput | void> {
  try {
    const validationResult = await validateFrameInteractionViaAirstack(messageBytes);

    return validationResult;
  } catch (error) {
    log.error('Error validating frame interaction via Airstack', { error });
  }
}
