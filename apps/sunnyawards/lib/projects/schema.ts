import { SunnyAwardsProjectType } from '@charmverse/core/prisma-client';
import { typedKeys } from '@packages/utils/types';
import { isGithubRepositoryUrl } from '@root/lib/github/isGithubRepositoryUrl';
import type { ProjectCategory as OptimismProjectCategory } from '@root/lib/optimism/projectSchema';
import { isAddress, type Address } from 'viem';
import { normalize } from 'viem/ens';
import * as yup from 'yup';

export const PROJECT_CATEGORIES = [
  {
    group: 'Creator',
    optimismCategory: 'NFT',
    items: ['Art Marketplace', 'Art NFTs', 'Other Media Marketplace', 'Other Media NFTs']
  },
  {
    group: 'DeFi',
    optimismCategory: 'DeFi',
    items: ['DEX', 'Real World Assets', 'Staking', 'Bridges', 'Lending']
  },
  {
    group: 'Social',
    optimismCategory: 'Social',
    items: ['Betting & Prediction Markets', 'Community & Curation', 'Gaming', 'Meme Community']
  },
  {
    group: 'Utility',
    optimismCategory: 'Utility',
    items: ['Airdrop', 'Donations', 'Identity', 'Payments']
  },
  {
    group: 'Farcaster',
    optimismCategory: 'Social',
    items: ['Frames', 'Channels']
  },
  {
    group: 'Other',
    optimismCategory: undefined,
    items: ['Other']
  }
] as const;

export const PROJECT_TYPES = typedKeys(SunnyAwardsProjectType);

export type SunnyProjectCategory = (typeof PROJECT_CATEGORIES)[number]['items'][number];

export function getOptimismCategory(category: SunnyProjectCategory): OptimismProjectCategory | undefined {
  // @ts-ignore TS can't infer the type of the items array properly
  const group = PROJECT_CATEGORIES.find(({ items }) => items.includes(category));
  return group?.optimismCategory;
}

export const schema = yup.object({
  id: yup.string(),
  name: yup.string().required('Project name is required'),
  description: yup.string().required('Project description is required'),
  avatar: yup.string(),
  coverImage: yup.string(),
  sunnyAwardsCategory: yup
    .string()
    .oneOf(PROJECT_CATEGORIES.map(({ items }) => items).flat())
    .nullable()
    .required(),
  sunnyAwardsCategoryDetails: yup.string(),
  websites: yup
    .array(
      yup.string().matches(
        // Regex sourced from https://stackoverflow.com/a/8234912
        // eslint-disable-next-line max-len, no-useless-escape
        /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/,
        'URL must be valid'
      )
    )
    .min(1, 'At least one website must be present'),
  farcasterValues: yup.array(yup.string()),
  github: yup
    .string()
    .optional()
    .test('isGithub', 'Github URL must be in format https://github.com/owner/repo', (value) => {
      if (!value) {
        return true;
      }

      return isGithubRepositoryUrl(value);
    }),
  twitter: yup
    .string()
    .optional()
    .test('isTwitter', 'Link must be a profile in format https://x.com/username or https://x.com/username', (value) => {
      if (!value) {
        return true;
      }

      return !!value.match(/https:\/\/(x|twitter).com\/[a-zA-Z0-9_]+/);
    }),
  sunnyAwardsProjectType: yup.string().oneOf(PROJECT_TYPES).required(),
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
        return isAddress(value);
      }

      return true;
    }),
  mintingWalletAddress: yup
    .string()
    .test(
      'mintingWalletAddress',
      'The wallet address or ENS you use to create onchain is required',
      async (value, context) => {
        if ((context.parent.sunnyAwardsProjectType as SunnyAwardsProjectType) === 'creator') {
          if (!value) {
            return false;
          }

          let address: string | null = value;

          if (address?.trim().endsWith('.eth')) {
            address = normalize(address);
          }

          return !!address;
        }
        return true;
      }
    ),
  projectMembers: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(),
        farcasterId: yup.number().required(),
        farcasterUser: yup.object({
          fid: yup.number().required(),
          displayName: yup.string(),
          pfpUrl: yup.string(),
          username: yup.string().required()
        })
      })
    )
    .required(),
  projectRefUIDToImport: yup.string().optional()
});

export type FormValues = yup.InferType<typeof schema>;
