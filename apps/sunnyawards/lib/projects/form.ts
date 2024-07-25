import { SunnyAwardsProjectType } from '@charmverse/core/prisma-client';
import { wagmiConfig } from '@root/connectors/config';
import { typedKeys } from '@root/lib/utils/objects';
import { getBytecode } from '@wagmi/core';
import type { Address } from 'viem';
import { isAddress } from 'viem';
import * as yup from 'yup';

export const CATEGORIES = ['CeFi', 'Cross Chain', 'DeFi', 'Governance', 'NFT', 'Social', 'Utility'] as const;

export const SUNNY_AWARD_CATEGORIES = typedKeys(SunnyAwardsProjectType);

export type ProjectCategory = (typeof CATEGORIES)[number];

export const schema = yup.object({
  id: yup.string(),
  name: yup.string().required('Project name is required'),
  description: yup.string(),
  avatar: yup.string(),
  coverImage: yup.string(),
  category: yup.string().oneOf(CATEGORIES).nullable().optional(),
  websites: yup.array(yup.string().url()),
  farcasterValues: yup.array(yup.string()),
  github: yup.string(),
  twitter: yup.string(),
  mirror: yup.string(),
  sunnyAwardsProjectType: yup.string().oneOf(SUNNY_AWARD_CATEGORIES).optional(),
  primaryContractAddress: yup
    .string<Address>()
    .test('isContract', 'Project contract address is required', async (value, context) => {
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
  primaryContractChainId: yup.string().test('isChainId', 'Invalid chain ID', async (value, context) => {
    if ((context.parent.sunnyAwardsProjectType as SunnyAwardsProjectType) === 'app') {
      return !!value && !Number.isNaN(parseInt(value));
    }

    return true;
  }),
  mintingWalletAddress: yup
    .string()
    .test('mintingWalletAddress', 'Artwork minting wallet address is required', async (value, context) => {
      if ((context.parent.sunnyAwardsProjectType as SunnyAwardsProjectType) === 'creator') {
        return !!value && isAddress(value);
      }

      return true;
    }),
  projectMembers: yup
    .array(
      yup.object({
        name: yup.string().required(),
        farcasterId: yup.number().required()
      })
    )
    .required()
    .min(1)
});

export type FormValues = yup.InferType<typeof schema>;
