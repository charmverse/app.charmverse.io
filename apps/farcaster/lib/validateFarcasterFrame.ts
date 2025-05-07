import * as adapters from '@packages/adapters/http';

export async function validateFarcasterFrame(data: {
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex: number;
    state: string;
  };
  trustedData: {
    messageBytes: string;
  };
}) {
  const messageBytes = data.trustedData.messageBytes;
  const result = await adapters.POST<{
    valid: boolean;
    action: {
      interactor: {
        fid: number;
      };
      timestamp: string;
    };
  }>(
    'https://api.neynar.com/v2/farcaster/frame/validate',
    {
      message_bytes_in_hex: messageBytes
    },
    {
      headers: {
        Api_key: process.env.NEYNAR_API_KEY
      }
    }
  );

  if (!result.valid) {
    throw new Error('Invalid frame');
  }

  const timestamp = Math.floor(new Date(result.action.timestamp).getTime() / 1000);
  if (timestamp <= new Date().getTime() / 1000 - 60) {
    throw new Error('Frame is too old');
  }

  return {
    fid: result.action.interactor.fid
  };
}
