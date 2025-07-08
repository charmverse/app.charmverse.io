import { yupResolver } from '@hookform/resolvers/yup';
import { wagmiConfig } from '@packages/blockchain/connectors/config';
import { isValidChainAddress } from '@packages/lib/tokens/validation';
import { getBytecode, readContract, readContracts } from '@wagmi/core';
import { useForm } from 'react-hook-form';
import { erc20Abi, isAddress, parseAbi } from 'viem';
import * as yup from 'yup';

import { tokenCheck } from '../utils/utils';

const tokenIds = tokenCheck.map((t) => t.id);
type TokenType = (typeof tokenIds)[number];

const schema = yup.object({
  chain: yup.string().required('Chain is required'),
  check: yup
    .string()
    .oneOf(tokenIds)
    .test('empty-check', 'Token selection is required', (option) => !!option),
  contract: yup.string().when('check', {
    is: (val: TokenType) => val === 'customToken' || val === 'customContractMethod',
    then: () =>
      yup
        .string<`0x${string}`>()
        .required('Contract is required')
        .test('isAddress', 'Invalid address', (value) => isValidChainAddress(value))
        .test('isContract', 'Invalid contract or chain', async (value, context) => {
          const chain = context.parent.chain;
          const check = context.parent.check;

          if (chain && check === 'customToken') {
            try {
              const chainId = Number(chain);
              await readContracts(wagmiConfig, {
                allowFailure: false,
                contracts: [
                  {
                    address: value,
                    chainId,
                    abi: erc20Abi,
                    functionName: 'decimals'
                  },
                  {
                    address: value,
                    chainId,
                    abi: erc20Abi,
                    functionName: 'totalSupply'
                  }
                ]
              });
              return true;
            } catch (err) {
              return false;
            }
          }

          return true;
        })
        .test('contractExists', 'No contract exists at this address', async (value, context) => {
          const chain = context.parent.chain;
          const check = context.parent.check;

          if (chain && isAddress(value) && check === 'customContractMethod') {
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
    otherwise: () => yup.string()
  }),
  method: yup.string().when('check', {
    is: (val: TokenType) => val === 'customContractMethod',
    then: () =>
      yup
        .string()
        .required('Method is required')
        .test('isMethod', 'Invalid or incorrect method', async (value, context) => {
          const check = context.parent.check;
          const chain = context.parent.chain;
          const contract = context.parent.contract;

          if (chain && isAddress(contract) && check === 'customContractMethod') {
            try {
              const chainId = Number(chain);
              await readContract(wagmiConfig, {
                address: contract as `0x${string}`,
                chainId,
                abi: parseAbi([`function ${value}(address) view returns (uint256)`]),
                functionName: value,
                args: [contract] // any address should do
              });
              return true;
            } catch (err) {
              return false;
            }
          }

          return true;
        }),
    otherwise: () => yup.string()
  }),
  quantity: yup
    .string()
    .required()
    .test('isNumber', 'Quantity must be a number greater then 0', (value) => !!Number(value))
});

export type FormValues = yup.InferType<typeof schema>;

const defaultValues: FormValues = {
  chain: '',
  check: '' as FormValues['check'],
  contract: '',
  quantity: ''
};

export function useTokensForm() {
  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  return methods;
}
