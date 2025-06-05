import { yupResolver } from '@hookform/resolvers/yup';
import { wagmiConfig } from '@packages/blockchain/connectors/config';
import { ercAbi } from '@packages/lib/tokenGates/abis/abis';
import { subscriptionTokenV1ABI } from '@packages/lib/tokenGates/hypersub/abi';
import { PublicLockV13 } from '@packages/lib/tokenGates/unlock/abi';
import { isValidChainAddress } from '@packages/lib/tokens/validation';
import { isBigInt } from '@packages/lib/utils/numbers';
import { readContract } from '@wagmi/core';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { nftCheck, collectableOptions, poapNameMatch, poapTypes } from '../utils/utils';

const poapNameMatchIds = poapNameMatch.map((p) => p.id);
const poapTypeIds = poapTypes.map((p) => p.id);
const nftCheckIds = nftCheck.map((n) => n.id);
const collectableOptionIds = collectableOptions.map((c) => c.id);
type PoapTypeIds = (typeof poapTypeIds)[number];
type CollectableOptionsId = (typeof collectableOptionIds)[number];
type NftCheck = (typeof nftCheckIds)[number];

const schema = yup.object({
  collectableOption: yup
    .string()
    .oneOf(collectableOptionIds, 'Invalid collectable option')
    .test('empty-collectable-option-check', 'Selection is required', (option) => !!option),
  chain: yup.string().when('collectableOption', {
    is: (val: CollectableOptionsId) => val === 'ERC721' || val === 'ERC1155' || val === 'Unlock' || val === 'Hypersub',
    then: () => yup.string().required('Chain is required'),
    otherwise: () => yup.string()
  }),
  contract: yup.string<`0x${string}`>().when('collectableOption', {
    is: (val: CollectableOptionsId) => val === 'ERC721' || val === 'ERC1155' || val === 'Unlock' || val === 'Hypersub',
    then: () =>
      yup
        .string<`0x${string}`>()
        .required('Contract is required')
        .test('isAddress', 'Invalid address', (value) => isValidChainAddress(value))
        .test('isContract', 'Invalid contract or chain', async (value, context) => {
          const collectableOption = context.parent.collectableOption;
          const chain = context.parent.chain;

          if (chain && collectableOption === 'Unlock') {
            try {
              await readContract(wagmiConfig, {
                address: value,
                chainId: Number(chain),
                abi: PublicLockV13,
                functionName: 'publicLockVersion'
              });
              return true;
            } catch (err) {
              return false;
            }
          } else if (chain && collectableOption === 'Hypersub') {
            try {
              await readContract(wagmiConfig, {
                address: value,
                chainId: Number(chain),
                abi: subscriptionTokenV1ABI,
                functionName: 'name'
              });
              return true;
            } catch (err) {
              return false;
            }
          } else if (chain && ['ERC721', 'ERC1155'].includes(collectableOption)) {
            try {
              await readContract(wagmiConfig, {
                address: value,
                chainId: Number(chain),
                abi: ercAbi,
                functionName: 'name'
              });
              return true;
            } catch (err) {
              return false;
            }
          }

          return true;
        }),
    otherwise: () => yup.string<`0x${string}`>()
  }),
  check: yup
    .string()
    .oneOf(nftCheckIds)
    .when('collectableOption', {
      is: (val: CollectableOptionsId) => val === 'ERC721',
      then: () => yup.string().required('Check is required'),
      otherwise: () => yup.string()
    }),
  tokenId: yup.string().when(['collectableOption', 'check'], {
    is: (collectableOption: CollectableOptionsId, check: NftCheck) =>
      (collectableOption === 'ERC721' && check === 'individual') || collectableOption === 'ERC1155',
    then: () =>
      yup
        .string()
        .required('Token id is required')
        .test('isTokenId', 'Invalid token Id', (value) => isBigInt(value)),
    otherwise: () => yup.string()
  }),
  quantity: yup
    .string()
    .when(['collectableOption', 'check'], {
      is: (collectableOption: CollectableOptionsId, check: NftCheck) =>
        collectableOption === 'ERC721' && check === 'group',
      then: () => yup.string().required('Quantity is required'),
      otherwise: () => yup.string()
    })
    .test('isNumber', 'Quantity must be a number', (value) => !!Number(value)),
  poapType: yup
    .string()
    .oneOf(poapTypeIds, 'Invalid POAP type')
    .when('collectableOption', {
      is: (val: CollectableOptionsId) => val === 'POAP',
      then: () => yup.string().required('Selection is required'),
      otherwise: () => yup.string()
    }),
  poapId: yup.string().when('poapType', {
    is: (val: PoapTypeIds) => val === 'id',
    then: () => yup.string().required('ID is required'),
    otherwise: () => yup.string()
  }),
  poapNameMatch: yup
    .string()
    .oneOf(poapNameMatchIds)
    .when('poapType', {
      is: (val: PoapTypeIds) => val === 'name',
      then: () => yup.string().required('Option is required'),
      otherwise: () => yup.string()
    }),
  poapName: yup.string().when('poapType', {
    is: (val: PoapTypeIds) => val === 'name',
    then: () => yup.string().required('Name is required'),
    otherwise: () => yup.string()
  })
});

export type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  collectableOption: '' as CollectableOptionsId,
  chain: '',
  contract: '' as `0x${string}`,
  check: '' as NftCheck,
  quantity: '',
  tokenId: '',
  poapType: undefined,
  poapId: '',
  poapName: '',
  poapNameMatch: undefined
};

export function useCollectablesForm() {
  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return methods;
}
