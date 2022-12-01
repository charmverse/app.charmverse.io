import { verifyMessage } from 'ethers/lib/utils';
import { SiweMessage } from 'lit-siwe';

import { lowerCaseEqual } from 'lib/utilities/strings';

type ProofParams = {
  address: string;
  chainId: `Chain ID: ${string}`;
  chainName: string;
  domain: string;
  // Stringified milliseconds epoch
  issuedAt: string;
  nonce: string;
  statement: string;
  uri: string;
  version: string;
};
type ProofContent = {
  message: string;
  signature: string;
  template: {
    format: string;
    params: ProofParams;
  };
  type: 'hybrid';
};
export const exampleSignature = {
  accessToken: 'wnynIJPPk67D8oKTS_PO3CP49AbSw0T2BsRWn8SeTqo.T5ada1JzwEwTazZ0cXnLAg-LMr8d6UQcQYS_BG6Tktc',
  expiresAt: 1669922801089,
  idToken: {
    acr: 'sig',
    amr: ['swk', 'v1.sig.ethereum.0x4A29c8fF7D6669618580A68dc691565B07b19e25'],
    at_hash: 'PoYi_tcPUSteeK2JKj-FaQ',
    aud: ['0e8c724d-bbb8-4876-9dc7-ddfb466a3a0f'],
    auth_time: 1669919199,
    domain_live: true,
    eip4361_message:
      'identity.unstoppabledomains.com wants you to sign in with your Ethereum account:\n0x4A29c8fF7D6669618580A68dc691565B07b19e25\n\nI consent to giving access to: openid wallet\n\nURI: uns:momakes.blockchain\nVersion: 1\nChain ID: 1\nNonce: 0x95b763c56e43f7af875c74c574fabdc57ad5c01eb18dddf3b0010ff49272ed9c\nIssued At: 2022-12-01T18:26:13.074Z',
    eip4361_signature:
      '0x139625cb6120babfaee1a85e30880253ea705ce4dacbd21a41c5c3b372e138af18a01d77c94eca7663b7a29610eb4a7ed564b86acc512db1175f6b7c6c3dbdcd1c',
    exp: 1669922800,
    iat: 1669919200,
    iss: 'https://auth.unstoppabledomains.com/',
    jti: '424f0ffa-6110-410b-8285-097cc3f0d504',
    nonce: 'bvjLPB4k7vCaagGAykH1OaRQa+XZ+Ir5HKC9Pw+XYAI=',
    proof: {
      'v1.sig.ethereum.0x4A29c8fF7D6669618580A68dc691565B07b19e25': {
        message:
          'identity.unstoppabledomains.com wants you to sign in with your Ethereum account:\n0x4A29c8fF7D6669618580A68dc691565B07b19e25\n\nI consent to giving access to: openid wallet\n\nURI: uns:momakes.blockchain\nVersion: 1\nChain ID: 1\nNonce: 0x95b763c56e43f7af875c74c574fabdc57ad5c01eb18dddf3b0010ff49272ed9c\nIssued At: 2022-12-01T18:26:13.074Z',
        signature:
          '0x139625cb6120babfaee1a85e30880253ea705ce4dacbd21a41c5c3b372e138af18a01d77c94eca7663b7a29610eb4a7ed564b86acc512db1175f6b7c6c3dbdcd1c',
        template: {
          format:
            'identity.unstoppabledomains.com wants you to sign in with your {{ chainName }} account:\n{{ address }}\n\n{{ statement }}\n\nURI: uns:{{ domain }}\n{{ version }}\n{{ chainId }}\nNonce: {{ nonce }}\nIssued At: 2022-12-01T18:26:13.074Z',
          params: {
            address: '0x4A29c8fF7D6669618580A68dc691565B07b19e25',
            chainId: 'Chain ID: 1',
            chainName: 'Ethereum',
            domain: 'momakes.blockchain',
            issuedAt: '1669919173074',
            nonce: '0x95b763c56e43f7af875c74c574fabdc57ad5c01eb18dddf3b0010ff49272ed9c',
            statement: 'I consent to giving access to: openid wallet',
            uri: 'uns:momakes.blockchain',
            version: 'Version: 1'
          }
        },
        type: 'hybrid'
      }
    },
    rat: 1669919169,
    sid: '72628444-4605-49eb-9baa-c63c17deb912',
    sub: 'momakes.blockchain',
    verified_addresses: [
      {
        address: '0x4a29c8ff7d6669618580a68dc691565b07b19e25',
        proof: {
          type: 'owner'
        },
        symbol: 'ETH'
      },
      {
        address: '0x4A29c8fF7D6669618580A68dc691565B07b19e25',
        proof: {
          message:
            'identity.unstoppabledomains.com wants you to sign in with your Ethereum account:\n0x4A29c8fF7D6669618580A68dc691565B07b19e25\n\nI consent to giving access to: openid wallet\n\nURI: uns:momakes.blockchain\nVersion: 1\nChain ID: 1\nNonce: 0x95b763c56e43f7af875c74c574fabdc57ad5c01eb18dddf3b0010ff49272ed9c\nIssued At: 2022-12-01T18:26:13.074Z',
          signature:
            '0x139625cb6120babfaee1a85e30880253ea705ce4dacbd21a41c5c3b372e138af18a01d77c94eca7663b7a29610eb4a7ed564b86acc512db1175f6b7c6c3dbdcd1c',
          template: {
            format:
              'identity.unstoppabledomains.com wants you to sign in with your {{ chainName }} account:\n{{ address }}\n\n{{ statement }}\n\nURI: uns:{{ domain }}\n{{ version }}\n{{ chainId }}\nNonce: {{ nonce }}\nIssued At: 2022-12-01T18:26:13.074Z',
            params: {
              address: '0x4A29c8fF7D6669618580A68dc691565B07b19e25',
              chainId: 'Chain ID: 1',
              chainName: 'Ethereum',
              domain: 'momakes.blockchain',
              issuedAt: '1669919173074',
              nonce: '0x95b763c56e43f7af875c74c574fabdc57ad5c01eb18dddf3b0010ff49272ed9c',
              statement: 'I consent to giving access to: openid wallet',
              uri: 'uns:momakes.blockchain',
              version: 'Version: 1'
            }
          },
          type: 'hybrid'
        },
        symbol: 'ETH'
      }
    ],
    wallet_address: '0x4a29c8ff7d6669618580a68dc691565b07b19e25',
    wallet_type_hint: 'walletconnect',
    __raw:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6InB1YmxpYzpoeWRyYS5vcGVuaWQuaWQtdG9rZW4iLCJ0eXAiOiJKV1QifQ.eyJhY3IiOiJzaWciLCJhbXIiOlsic3drIiwidjEuc2lnLmV0aGVyZXVtLjB4NEEyOWM4ZkY3RDY2Njk2MTg1ODBBNjhkYzY5MTU2NUIwN2IxOWUyNSJdLCJhdF9oYXNoIjoiUG9ZaV90Y1BVU3RlZUsySktqLUZhUSIsImF1ZCI6WyIwZThjNzI0ZC1iYmI4LTQ4NzYtOWRjNy1kZGZiNDY2YTNhMGYiXSwiYXV0aF90aW1lIjoxNjY5OTE5MTk5LCJkb21haW5fbGl2ZSI6dHJ1ZSwiZWlwNDM2MV9tZXNzYWdlIjoiaWRlbnRpdHkudW5zdG9wcGFibGVkb21haW5zLmNvbSB3YW50cyB5b3UgdG8gc2lnbiBpbiB3aXRoIHlvdXIgRXRoZXJldW0gYWNjb3VudDpcbjB4NEEyOWM4ZkY3RDY2Njk2MTg1ODBBNjhkYzY5MTU2NUIwN2IxOWUyNVxuXG5JIGNvbnNlbnQgdG8gZ2l2aW5nIGFjY2VzcyB0bzogb3BlbmlkIHdhbGxldFxuXG5VUkk6IHVuczptb21ha2VzLmJsb2NrY2hhaW5cblZlcnNpb246IDFcbkNoYWluIElEOiAxXG5Ob25jZTogMHg5NWI3NjNjNTZlNDNmN2FmODc1Yzc0YzU3NGZhYmRjNTdhZDVjMDFlYjE4ZGRkZjNiMDAxMGZmNDkyNzJlZDljXG5Jc3N1ZWQgQXQ6IDIwMjItMTItMDFUMTg6MjY6MTMuMDc0WiIsImVpcDQzNjFfc2lnbmF0dXJlIjoiMHgxMzk2MjVjYjYxMjBiYWJmYWVlMWE4NWUzMDg4MDI1M2VhNzA1Y2U0ZGFjYmQyMWE0MWM1YzNiMzcyZTEzOGFmMThhMDFkNzdjOTRlY2E3NjYzYjdhMjk2MTBlYjRhN2VkNTY0Yjg2YWNjNTEyZGIxMTc1ZjZiN2M2YzNkYmRjZDFjIiwiZXhwIjoxNjY5OTIyODAwLCJpYXQiOjE2Njk5MTkyMDAsImlzcyI6Imh0dHBzOi8vYXV0aC51bnN0b3BwYWJsZWRvbWFpbnMuY29tLyIsImp0aSI6IjQyNGYwZmZhLTYxMTAtNDEwYi04Mjg1LTA5N2NjM2YwZDUwNCIsIm5vbmNlIjoiYnZqTFBCNGs3dkNhYWdHQXlrSDFPYVJRYStYWitJcjVIS0M5UHcrWFlBST0iLCJwcm9vZiI6eyJ2MS5zaWcuZXRoZXJldW0uMHg0QTI5YzhmRjdENjY2OTYxODU4MEE2OGRjNjkxNTY1QjA3YjE5ZTI1Ijp7Im1lc3NhZ2UiOiJpZGVudGl0eS51bnN0b3BwYWJsZWRvbWFpbnMuY29tIHdhbnRzIHlvdSB0byBzaWduIGluIHdpdGggeW91ciBFdGhlcmV1bSBhY2NvdW50OlxuMHg0QTI5YzhmRjdENjY2OTYxODU4MEE2OGRjNjkxNTY1QjA3YjE5ZTI1XG5cbkkgY29uc2VudCB0byBnaXZpbmcgYWNjZXNzIHRvOiBvcGVuaWQgd2FsbGV0XG5cblVSSTogdW5zOm1vbWFrZXMuYmxvY2tjaGFpblxuVmVyc2lvbjogMVxuQ2hhaW4gSUQ6IDFcbk5vbmNlOiAweDk1Yjc2M2M1NmU0M2Y3YWY4NzVjNzRjNTc0ZmFiZGM1N2FkNWMwMWViMThkZGRmM2IwMDEwZmY0OTI3MmVkOWNcbklzc3VlZCBBdDogMjAyMi0xMi0wMVQxODoyNjoxMy4wNzRaIiwic2lnbmF0dXJlIjoiMHgxMzk2MjVjYjYxMjBiYWJmYWVlMWE4NWUzMDg4MDI1M2VhNzA1Y2U0ZGFjYmQyMWE0MWM1YzNiMzcyZTEzOGFmMThhMDFkNzdjOTRlY2E3NjYzYjdhMjk2MTBlYjRhN2VkNTY0Yjg2YWNjNTEyZGIxMTc1ZjZiN2M2YzNkYmRjZDFjIiwidGVtcGxhdGUiOnsiZm9ybWF0IjoiaWRlbnRpdHkudW5zdG9wcGFibGVkb21haW5zLmNvbSB3YW50cyB5b3UgdG8gc2lnbiBpbiB3aXRoIHlvdXIge3sgY2hhaW5OYW1lIH19IGFjY291bnQ6XG57eyBhZGRyZXNzIH19XG5cbnt7IHN0YXRlbWVudCB9fVxuXG5VUkk6IHVuczp7eyBkb21haW4gfX1cbnt7IHZlcnNpb24gfX1cbnt7IGNoYWluSWQgfX1cbk5vbmNlOiB7eyBub25jZSB9fVxuSXNzdWVkIEF0OiAyMDIyLTEyLTAxVDE4OjI2OjEzLjA3NFoiLCJwYXJhbXMiOnsiYWRkcmVzcyI6IjB4NEEyOWM4ZkY3RDY2Njk2MTg1ODBBNjhkYzY5MTU2NUIwN2IxOWUyNSIsImNoYWluSWQiOiJDaGFpbiBJRDogMSIsImNoYWluTmFtZSI6IkV0aGVyZXVtIiwiZG9tYWluIjoibW9tYWtlcy5ibG9ja2NoYWluIiwiaXNzdWVkQXQiOiIxNjY5OTE5MTczMDc0Iiwibm9uY2UiOiIweDk1Yjc2M2M1NmU0M2Y3YWY4NzVjNzRjNTc0ZmFiZGM1N2FkNWMwMWViMThkZGRmM2IwMDEwZmY0OTI3MmVkOWMiLCJzdGF0ZW1lbnQiOiJJIGNvbnNlbnQgdG8gZ2l2aW5nIGFjY2VzcyB0bzogb3BlbmlkIHdhbGxldCIsInVyaSI6InVuczptb21ha2VzLmJsb2NrY2hhaW4iLCJ2ZXJzaW9uIjoiVmVyc2lvbjogMSJ9fSwidHlwZSI6Imh5YnJpZCJ9fSwicmF0IjoxNjY5OTE5MTY5LCJzaWQiOiI3MjYyODQ0NC00NjA1LTQ5ZWItOWJhYS1jNjNjMTdkZWI5MTIiLCJzdWIiOiJtb21ha2VzLmJsb2NrY2hhaW4iLCJ2ZXJpZmllZF9hZGRyZXNzZXMiOlt7ImFkZHJlc3MiOiIweDRhMjljOGZmN2Q2NjY5NjE4NTgwYTY4ZGM2OTE1NjViMDdiMTllMjUiLCJwcm9vZiI6eyJ0eXBlIjoib3duZXIifSwic3ltYm9sIjoiRVRIIn0seyJhZGRyZXNzIjoiMHg0QTI5YzhmRjdENjY2OTYxODU4MEE2OGRjNjkxNTY1QjA3YjE5ZTI1IiwicHJvb2YiOnsibWVzc2FnZSI6ImlkZW50aXR5LnVuc3RvcHBhYmxlZG9tYWlucy5jb20gd2FudHMgeW91IHRvIHNpZ24gaW4gd2l0aCB5b3VyIEV0aGVyZXVtIGFjY291bnQ6XG4weDRBMjljOGZGN0Q2NjY5NjE4NTgwQTY4ZGM2OTE1NjVCMDdiMTllMjVcblxuSSBjb25zZW50IHRvIGdpdmluZyBhY2Nlc3MgdG86IG9wZW5pZCB3YWxsZXRcblxuVVJJOiB1bnM6bW9tYWtlcy5ibG9ja2NoYWluXG5WZXJzaW9uOiAxXG5DaGFpbiBJRDogMVxuTm9uY2U6IDB4OTViNzYzYzU2ZTQzZjdhZjg3NWM3NGM1NzRmYWJkYzU3YWQ1YzAxZWIxOGRkZGYzYjAwMTBmZjQ5MjcyZWQ5Y1xuSXNzdWVkIEF0OiAyMDIyLTEyLTAxVDE4OjI2OjEzLjA3NFoiLCJzaWduYXR1cmUiOiIweDEzOTYyNWNiNjEyMGJhYmZhZWUxYTg1ZTMwODgwMjUzZWE3MDVjZTRkYWNiZDIxYTQxYzVjM2IzNzJlMTM4YWYxOGEwMWQ3N2M5NGVjYTc2NjNiN2EyOTYxMGViNGE3ZWQ1NjRiODZhY2M1MTJkYjExNzVmNmI3YzZjM2RiZGNkMWMiLCJ0ZW1wbGF0ZSI6eyJmb3JtYXQiOiJpZGVudGl0eS51bnN0b3BwYWJsZWRvbWFpbnMuY29tIHdhbnRzIHlvdSB0byBzaWduIGluIHdpdGggeW91ciB7eyBjaGFpbk5hbWUgfX0gYWNjb3VudDpcbnt7IGFkZHJlc3MgfX1cblxue3sgc3RhdGVtZW50IH19XG5cblVSSTogdW5zOnt7IGRvbWFpbiB9fVxue3sgdmVyc2lvbiB9fVxue3sgY2hhaW5JZCB9fVxuTm9uY2U6IHt7IG5vbmNlIH19XG5Jc3N1ZWQgQXQ6IDIwMjItMTItMDFUMTg6MjY6MTMuMDc0WiIsInBhcmFtcyI6eyJhZGRyZXNzIjoiMHg0QTI5YzhmRjdENjY2OTYxODU4MEE2OGRjNjkxNTY1QjA3YjE5ZTI1IiwiY2hhaW5JZCI6IkNoYWluIElEOiAxIiwiY2hhaW5OYW1lIjoiRXRoZXJldW0iLCJkb21haW4iOiJtb21ha2VzLmJsb2NrY2hhaW4iLCJpc3N1ZWRBdCI6IjE2Njk5MTkxNzMwNzQiLCJub25jZSI6IjB4OTViNzYzYzU2ZTQzZjdhZjg3NWM3NGM1NzRmYWJkYzU3YWQ1YzAxZWIxOGRkZGYzYjAwMTBmZjQ5MjcyZWQ5YyIsInN0YXRlbWVudCI6IkkgY29uc2VudCB0byBnaXZpbmcgYWNjZXNzIHRvOiBvcGVuaWQgd2FsbGV0IiwidXJpIjoidW5zOm1vbWFrZXMuYmxvY2tjaGFpbiIsInZlcnNpb24iOiJWZXJzaW9uOiAxIn19LCJ0eXBlIjoiaHlicmlkIn0sInN5bWJvbCI6IkVUSCJ9XSwid2FsbGV0X2FkZHJlc3MiOiIweDRhMjljOGZmN2Q2NjY5NjE4NTgwYTY4ZGM2OTE1NjViMDdiMTllMjUiLCJ3YWxsZXRfdHlwZV9oaW50Ijoid2FsbGV0Y29ubmVjdCJ9.CCRznAZnFd7fQjXEtqZIE35i1USEwp13tw4kHfvThiXgBGQqF7QsKe14Gl0nBpOcUYSXJVDL28-wX37EPAlqOK4q-ro2TsdL7mterfCLqbepza8k_jkpKe3mz76yefmjvU0W3joNUi_2ot4Pfs4OHCQL_qplOmM2LbkX40Spii396lYioXM98eFPHODzt24uJ1VcfHPSfAWUNbQbiM7QqM4ZEkojU8PWPxZlcaZwL1lLbL6pneCdXwzK9Wt8Kn6a-gUa68H1nEHQssXHpkekZdzqC5EqrZFoY0yFvTYBK9XOX4DAyxo1n2LsR5MJ3TtxmzETLWmguDoIv6TE55UOr-1cPZkppI0_uoqE0ra2yjxsbbjKTM6YZxRYidW0WSJem0XuPaQSt1MMRNrTpxfh1NxcImjn3tQ5srBGvAbGwPPUXBJfvJWkMRXAADxC_Q-dYT59OzXhw_Xy5TPMr5PECGUcLsm7Myq5hyWNaOJ-ZF8lwBPc4WjOTfVZuJZry4Oygav1tr3XFcAA4mEMD5q5S52JhtcoxqnmqaKOeN9kddQ-yFQjRFxlxWC0aGDBCuwk7ufsLOAZbccCNkZvgcT64HXR15GfMOLoDPcnnWRX32ClthkC1NXRskBap9tf1qrejC0DSSTpEvzDe9bUfy1g7QiDy6kfewpCAJ9pKCZKl-w'
  },
  scope: 'openid wallet'
};
export function verifyUnstoppableDomainsSignature(authSig: typeof exampleSignature): boolean {
  const { idToken } = authSig;

  const verificationKey = idToken.amr.find((item) => item.match('v1.sig.ethereum'));

  if (!verificationKey) {
    return false;
  }

  const address = verificationKey.split('v1.sig.ethereum')?.[1];

  const proofs = idToken.proof as Record<string, ProofContent>;

  const verificationProof = proofs[verificationKey as any];
  const verificationParams = verificationProof.template.params;

  const chainId = parseInt(verificationParams.chainId.split('Chain ID:')[1].trim());
  const nonce = verificationParams.nonce;
  const issuedAt = verificationParams.nonce;

  const payload: Partial<SiweMessage> = {
    address: verificationParams.address,
    chainId,
    domain: 'momakes.blockchain',
    nonce,
    issuedAt,
    expirationTime: new Date(authSig.idToken.exp).toISOString()
  };

  // Try with params direct

  const message = new SiweMessage(payload);

  const body = message.prepareMessage();

  const signatureAddress = verifyMessage(body, verificationProof.signature);

  if (!lowerCaseEqual(signatureAddress, address)) {
    return false;
  }

  return true;
}
