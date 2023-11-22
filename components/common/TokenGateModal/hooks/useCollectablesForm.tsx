import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { isValidChainAddress } from 'lib/tokens/validation';

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
    .required()
    .oneOf([...collectableOptionIds, ''] as const, 'Invalid collectable option'),
  chain: yup.string().when('collectableOption', {
    is: (val: CollectableOptionsId) => val === 'ERC721' || val === 'ERC1155',
    then: () => yup.string().required('Chain is required'),
    otherwise: () => yup.string()
  }),
  contract: yup.string().when('collectableOption', {
    is: (val: CollectableOptionsId) => val === 'ERC721' || val === 'ERC1155',
    then: () =>
      yup
        .string()
        .required('Contract is required')
        .test('isAddress', 'Invalid address', (value) => isValidChainAddress(value)),
    otherwise: () => yup.string()
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
    then: () => yup.string().required('Token id is required'),
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
  collectableOption: '',
  chain: '',
  contract: '',
  check: 'individual',
  quantity: '',
  tokenId: '',
  poapType: undefined,
  poapId: '',
  poapName: undefined,
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
