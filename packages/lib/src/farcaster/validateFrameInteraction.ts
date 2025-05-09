import { log } from '@charmverse/core/log';
import { POST } from '@packages/adapters/http';

import { NEYNAR_API_BASE_URL, NEYNAR_API_KEY } from './constants';

export type FarcasterFrameInteractionToValidate = {
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex: number;
    castId: {
      fid: number;
      hash: string;
    };
  };
  trustedData: {
    messageBytes: string;
  };
};

type ValidatedFrameActionType = {
  valid: boolean;
  action: {
    object: string;
    url: string;
    interactor: {
      object: string;
      fid: number;
      custody_address: string;
      username: string;
      display_name: string;
      pfp_url: string;
      profile: {
        bio: {
          text: string;
        };
      };
      follower_count: number;
      following_count: number;
      verifications: string[];
      verified_addresses: {
        eth_addresses: string[];
        sol_addresses: string[];
      };
      active_status: string;
      power_badge: boolean;
    };
    tapped_button: {
      index: number;
    };
    state: {
      serialized: string;
    };
    cast: Record<string, unknown>;
    timestamp: string;
  };
  signature_temporary_object: {
    note: string;
    hash: string;
    hash_scheme: string;
    signature: string;
    signature_scheme: string;
    signer: string;
  };
};

/**
 * @messageBytes - Raw data under trustedData.messageBytes from a Frame request
 */
export async function validateFrameInteraction(
  messageBytes: string
): Promise<(ValidatedFrameActionType & { valid: true }) | { valid: false }> {
  try {
    const validationResult = await POST<ValidatedFrameActionType>(
      `${NEYNAR_API_BASE_URL}/frame/validate`,
      {
        message_bytes_in_hex: messageBytes
      },
      {
        headers: {
          api_key: NEYNAR_API_KEY
        }
      }
    );

    return validationResult;
  } catch (error) {
    log.warn('Error validating frame interaction', { error });

    return { valid: false };
  }
}
