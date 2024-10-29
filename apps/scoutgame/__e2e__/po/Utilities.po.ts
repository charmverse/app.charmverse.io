import crypto from 'node:crypto';

import { log } from '@charmverse/core/log';
import { installMockWallet } from '@johanneskares/wallet-mock';
import type { Page } from '@playwright/test';
import type { Transport } from 'viem';
import { custom, http, isHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimism } from 'viem/chains';

export class Utilities {
  // eslint-disable-next-line no-useless-constructor
  constructor(private page: Page) {
    // silence is golden
  }

  async loginAsUserId(userId: string) {
    return this.page.request.get(`/api/login-dev?userId=${userId}`);
  }

  async initMockWallet(httpTransport?: Record<number, Transport>) {
    const privateKey = `0x${crypto.randomBytes(32).toString('hex')}`;
    const addressKey = isHex(privateKey) ? privateKey : null;

    // This can actually call the real chain or mock it. Ideally we want to mock it.
    const transports: Record<number, Transport> = {
      [optimism.id]: (config) => {
        return custom({
          request: async ({ method, params }) => {
            if (method === 'eth_estimateGas') {
              return 500000;
            }

            if (method === 'eth_sendRawTransaction') {
              return `0x1234567890abcdef1234567890abcdef1234567890abcde${Math.random().toString(16).slice(2, 15)}`;
            }

            if (method === 'eth_blockNumber') {
              return {
                jsonrpc: '2.0',
                result: '0x7951289',
                id: 6936821969120550
              };
            }

            if (method === 'eth_getBlockByNumber') {
              return {
                jsonrpc: '2.0',
                result: {
                  baseFeePerGas: '0x978',
                  blobGasUsed: '0x0',
                  difficulty: '0x0',
                  excessBlobGas: '0x0',
                  extraData: '0x',
                  gasLimit: '0x3938700',
                  gasUsed: '0x1268840',
                  hash: '0x6ac5042575261f63e963ece1cba62d4f8202e2c08174dfd546fc095bd346c6c5',
                  logsBloom:
                    '0x0339104070031100d90021a0226c08288002702286212220695402024da06914050800063800021c880a80300414640400e0004000306210c0508b01c0a40201214011a80108a08800a000090002c02082800044400002038006000480200820008c00082b0544441882519328000a28838820456c188000006802120899080808205585000000e2681002800020820012001005ac200e81401075402900810083908008de05021030108405c0001402630040010040000120800200161200204080180280800900200081060052210102910080068043020300002010062910d290a0012528720008d014104008512200a11060148048444820142300250207',
                  miner: '0x4200000000000000000000000000000000000011',
                  mixHash: '0x07b86f3c95045643ae83f0c238e7bb2584ddc067c4521729549fc25ea20fcd89',
                  nonce: '0x0000000000000000',
                  number: '0x7951294',
                  parentBeaconBlockRoot: '0xa1f03f870b131f4497bdc98e98ae54e41926523a7a83a20385b423c5ddda068c',
                  parentHash: '0xfe331f8e61dc82393a57ca2bbbc659702a42d5539725b09d54b30450867c7d4c',
                  receiptsRoot: '0x7d19ff4aa06db6448a460b4ce385b2f69ed6164d8393633128439b31d8c1e645',
                  sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
                  size: '0x1713',
                  stateRoot: '0xb762dd245d0e74a63447c43784164f42062d1a96baf3436a111b245b01cac36e',
                  timestamp: '0x671dfee1',
                  transactions: ['0x3a8ed824ed3ebdd552dad8a6313a9525c82094b6e9f48480d9eb1a5f4589c5c7'],
                  transactionsRoot: '0x8e4ac9044e5b359c9064dd7632c16a9b1b96d3cd23908b965ec0435c812aa1fa',
                  uncles: [],
                  withdrawals: [],
                  withdrawalsRoot: '0x56e81f134bcc55a6ff8345e692c0g86e5b48e01b996cadc001622fb5e363b423'
                },
                id: 741266197112202
              };
            }

            if (method === 'eth_call') {
              return {
                jsonrpc: '2.0',
                result:
                  '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000052fe7b734b39fg000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                id: '00d8eb1b-8bf2-4ad0-8b2f-1c4a70e61c96'
              };
            }

            // Fake everything and throw an error after
            // Add more "if" methods and add default inside the utils.initMockWallet because most of them we need them in all the cases
            const response = await http()(config).request({ method, params });

            return response;
          }
        })(config);
      },
      ...httpTransport
    };

    if (!addressKey) {
      log.error('Invalid private key in testing installMockWallet.');
      return;
    }

    await installMockWallet({
      page: this.page,
      account: privateKeyToAccount(addressKey),
      defaultChain: optimism,
      transports
    });
  }
}
