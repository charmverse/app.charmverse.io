import { ListItemIcon, ListItemText, MenuItem, Select } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import Image from 'next/image';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import type { Chain } from 'viem/chains';
import {
  optimism,
  base,
  arbitrum,
  zora,
  mainnet,
  optimismSepolia,
  baseSepolia,
  arbitrumSepolia,
  zoraSepolia,
  sepolia
} from 'viem/chains';

export type ChainOption = { name: string; id: number; icon: string; chain: Chain; usdcAddress: string };

export const chainOptionsMainnet: ChainOption[] = [
  {
    name: 'Optimism',
    id: optimism.id,
    icon: '/images/crypto/op64.png',
    chain: optimism,
    usdcAddress: '0x0b2c639c533813f4aa9d7837caf62653d097ff85'
  },
  {
    name: 'Base',
    id: base.id,
    icon: '/images/crypto/base64.png',
    chain: base,
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  },
  {
    name: 'Arbitrum',
    id: arbitrum.id,
    icon: '/images/crypto/arbitrum.png',
    chain: arbitrum,
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
  },
  { name: 'Zora', id: zora.id, icon: '/images/crypto/zora64.png', chain: zora, usdcAddress: '' },
  {
    name: 'Mainnet',
    id: mainnet.id,
    icon: '/images/crypto/ethereum-eth-logo.png',
    chain: mainnet,
    usdcAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  }
];

export const chainOptionsTestnet: ChainOption[] = [
  {
    name: 'Optimism Sepolia',
    id: optimismSepolia.id,
    icon: '/images/crypto/op64.png',
    chain: optimismSepolia,
    usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7'
  },
  {
    name: 'Base Sepolia',
    id: baseSepolia.id,
    icon: '/images/crypto/base64.png',
    chain: baseSepolia,
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
  },
  {
    name: 'Arbitrum Sepolia',
    id: arbitrumSepolia.id,
    icon: '/images/crypto/arbitrum.png',
    chain: arbitrumSepolia,
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'
  },
  { name: 'Zora Sepolia', id: zoraSepolia.id, icon: '/images/crypto/zora64.png', chain: zoraSepolia, usdcAddress: '' },
  {
    name: 'Sepolia',
    id: sepolia.id,
    icon: '/images/crypto/ethereum-eth-logo.png',
    chain: sepolia,
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  }
];

export function getChainOptions({ useTestnets }: { useTestnets?: boolean } = { useTestnets: false }): ChainOption[] {
  return useTestnets ? chainOptionsTestnet : chainOptionsMainnet;
}

function SelectField(
  props: Omit<SelectProps<string>, 'onClick' | 'useTestnets'> & {
    helperMessage?: ReactNode;
    onSelectChain: (chainId: number) => void;
    ref: Ref<unknown>;
    useTestnets?: boolean;
  }
) {
  const { helperMessage, ...restProps } = props;

  const chainOpts = getChainOptions({ useTestnets: props.useTestnets });

  return (
    // @ts-ignore
    <Select<string>
      fullWidth
      displayEmpty
      renderValue={(selected) =>
        chainOpts.find(({ id }) => (selected as unknown as number) === id)?.name || 'Select a Chain'
      }
      {...restProps}
    >
      <MenuItem value='' disabled>
        Select a Chain
      </MenuItem>
      {chainOpts.map((_chain, _index) => {
        return (
          <MenuItem
            key={_chain.id}
            value={_chain.id}
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              props.onSelectChain(_chain.id);
            }}
          >
            <ListItemIcon>
              <Image height={20} width={20} alt='' src={_chain.icon} />
            </ListItemIcon>
            <ListItemText>{_chain.name}</ListItemText>
          </MenuItem>
        );
      })}
    </Select>
  );
}

export const BlockchainSelect = forwardRef(SelectField);
