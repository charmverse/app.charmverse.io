import { SunnyAwardsProjectType } from '@charmverse/core/prisma-client';
import { wagmiConfig } from '@root/connectors/config';
import { resolveEnsAddress } from '@root/lib/blockchain/resolveEnsAddress';
import { typedKeys } from '@root/lib/utils/objects';
import { getBytecode, getTransactionReceipt } from '@wagmi/core';
import type { Address } from 'viem';
import { isAddress } from 'viem';
import * as yup from 'yup';

export const CATEGORIES = ['CeFi', 'Cross Chain', 'DeFi', 'Governance', 'NFT', 'Social', 'Utility'] as const;

export const SUNNY_AWARD_CATEGORIES = typedKeys(SunnyAwardsProjectType);

export type ProjectCategory = (typeof CATEGORIES)[number];

export const schema = yup.object({
  id: yup.string(),
  name: yup.string().required('Project name is required'),
  description: yup.string().required('Project description is required'),
  avatar: yup.string(),
  coverImage: yup.string(),
  category: yup.string().oneOf(CATEGORIES).nullable().required(),
  websites: yup.array(yup.string().url()).min(1),
  farcasterValues: yup.array(yup.string()),
  github: yup.string().optional(),
  twitter: yup.string().optional(),
  sunnyAwardsProjectType: yup.string().oneOf(SUNNY_AWARD_CATEGORIES).required(),
  primaryContractChainId: yup.string().test('isChainId', 'Invalid chain ID', async (value, context) => {
    if ((context.parent.sunnyAwardsProjectType as SunnyAwardsProjectType) === 'app') {
      return !!value && !Number.isNaN(parseInt(value));
    }

    return true;
  }),
  primaryContractAddress: yup
    .string<Address>()
    .test('isContractAddress', 'Project contract address must be a valid contract', async (value, context) => {
      const chain = context.parent.primaryContractChainId;
      const sunnyAwardsProjectType = context.parent.sunnyAwardsProjectType as SunnyAwardsProjectType;

      if (sunnyAwardsProjectType === 'app') {
        if (!value) {
          return false;
        }
        const chainId = Number(chain);
        try {
          const result = await getBytecode(wagmiConfig, {
            address: value,
            chainId
          });
          return !!result;
        } catch (err) {
          return false;
        }
      }

      return true;
    }),
  primaryContractDeployTxHash: yup
    .string<Address>()
    .test('isContractDeployTx', 'Valid transaction is required', async (value, context) => {
      const chain = context.parent.primaryContractChainId;
      const sunnyAwardsProjectType = context.parent.sunnyAwardsProjectType as SunnyAwardsProjectType;

      if (sunnyAwardsProjectType === 'app') {
        if (!value || !chain) {
          return false;
        }
        const chainId = Number(chain);
        try {
          const result = await getTransactionReceipt(wagmiConfig, {
            hash: value,
            chainId
          });
          return !!result;
        } catch (err) {
          return false;
        }
      }

      return true;
    }),
  primaryContractDeployer: yup
    .string<Address>()
    .test('isAddress', 'Must be a valid address', async (value, context) => {
      const sunnyAwardsProjectType = context.parent.sunnyAwardsProjectType as SunnyAwardsProjectType;

      if (sunnyAwardsProjectType === 'app') {
        if (!value) {
          return false;
        }
        return !!isAddress(value);
      }

      return true;
    }),
  mintingWalletAddress: yup
    .string()
    .test('mintingWalletAddress', 'Artwork minting wallet address or ENS is required', async (value, context) => {
      if ((context.parent.sunnyAwardsProjectType as SunnyAwardsProjectType) === 'creator') {
        if (!value) {
          return false;
        }

        let address: string | null = value;

        if (address?.endsWith('.eth')) {
          address = await resolveEnsAddress(value);
        }

        return !!address && !!isAddress(address);
      }
      return true;
    }),
  projectMembers: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(),
        farcasterId: yup.number().required()
      })
    )
    .required()
    .min(1)
});

export type FormValues = yup.InferType<typeof schema>;
