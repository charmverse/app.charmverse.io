import { log } from '@charmverse/core/log';
import { POST } from '@root/adapters/http';

import { prettyPrint } from '../utils/strings';

import type { FarcasterFrameInteractionToValidate } from './validateFrameInteraction';

type FrameActionBody = {
  url: number[];
  buttonIndex: number;
  castId: {
    fid: number;
    hash: number[];
  };
  inputText: any[];
  state: any[];
  transactionId: any[];
};

type MessageData = {
  type: number;
  fid: number;
  timestamp: number;
  network: number;
  castAddBody?: undefined;
  castRemoveBody?: undefined;
  reactionBody?: undefined;
  verificationAddAddressBody?: undefined;
  verificationRemoveBody?: undefined;
  userDataBody?: undefined;
  linkBody?: undefined;
  usernameProofBody?: undefined;
  frameActionBody?: FrameActionBody;
};

type Message = {
  data: MessageData;
  hash: number[];
  hashScheme: number;
  signature: number[];
  signatureScheme: number;
  signer: number[];
  dataBytes?: undefined;
};

type MoxieValidationResult = {
  isValid: boolean;
  message: Message;
};

type PacketToValidate = {
  packet: FarcasterFrameInteractionToValidate;
};

export function validateFrameInteractionViaMoxie({ packet }: PacketToValidate): Promise<MoxieValidationResult> {
  const apiEndpoint = 'https://hubs.airstack.xyz/v1/validateMessage';

  return POST<MoxieValidationResult>(apiEndpoint, packet, {
    headers: {
      'Content-Type': 'none',
      'x-airstack-hubs': process.env.AIRSTACK_API_KEY as string
    }
  });
}

export async function validateFrameInteractionViaMoxieWithErrorCatching({
  packet
}: PacketToValidate): Promise<MoxieValidationResult | void> {
  try {
    prettyPrint({ packet });

    const validationResult = await validateFrameInteractionViaMoxie({ packet });

    prettyPrint({ info: 'Moxie validation result', validationResult });

    return validationResult;
  } catch (error) {
    log.error('Error validating frame interaction via Airstack', { error });
  }
}

validateFrameInteractionViaMoxieWithErrorCatching({
  packet: {
    untrustedData: {
      fid: 4339,
      url: 'https://1420-105-197-126-0.ngrok-free.app/api/frame/4339/waitlist',
      messageHash: '0xbe652b0f01c60f6a22c48ecd574d556c3d7b6377',
      timestamp: 1726822871000,
      network: 1,
      buttonIndex: 1,
      castId: {
        fid: 1,
        hash: '0x0000000000000000000000000000000000000000'
      }
    },
    trustedData: {
      messageBytes:
        '0a6e080d10f32118d7a7fb37200182015f0a4168747470733a2f2f313432302d3130352d3139372d3132362d302e6e67726f6b2d667265652e6170702f6170692f6672616d652f343333392f776169746c69737410011a180801121400000000000000000000000000000000000000001214be652b0f01c60f6a22c48ecd574d556c3d7b637718012240489936b1792074af957afff340449f24aa3159147d41d36fc219986ab99012c4778b0f089b6ed53311efe45ae605a4176f5151bbd13c8e9407cbb70f7419f90e280132209aaa0dfd09205dee44e603657cbfa6952846c4380d0dbf0104fb0085ec6a8e60'
    }
  }
});
