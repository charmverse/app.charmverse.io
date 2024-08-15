import { ListItemIcon, ListItemText, MenuItem, Select } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import Image from 'next/image';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

const chainOptions: { name: string; id: number; icon: string }[] = [
  { name: 'Optimism', id: 10, icon: '/images/crypto/op64.png' },
  { name: 'Zora', id: 7777777, icon: '/images/crypto/zora64.png' },
  { name: 'Base', id: 8453, icon: '/images/crypto/base64.png' },
  { name: 'Mode', id: 34443, icon: '/images/crypto/mode64.png' },
  { name: 'Lisk', id: 1135, icon: '/images/crypto/lisk64.png' },
  { name: 'Metal', id: 1750, icon: '/images/crypto/metal64.png' },
  { name: 'Mint', id: 185, icon: '/images/crypto/mint64.png' },
  { name: 'Fraxtal', id: 2522, icon: '/images/crypto/frax64.png' },
  { name: 'Redstone', id: 690, icon: '/images/crypto/redstone64.png' },
  { name: 'Cyber', id: 7560, icon: '/images/crypto/cyber64.png' }
];

function SelectField(props: SelectProps<string> & { helperMessage?: ReactNode }, ref: Ref<unknown>) {
  const { helperMessage, ...restProps } = props;

  return (
    <Select<string>
      fullWidth
      displayEmpty
      renderValue={(selected) => chainOptions.find(({ id }) => selected === id.toString())?.name || 'Select a Chain'}
      ref={ref}
      {...restProps}
    >
      {chainOptions.map((_chain, _index) => {
        return (
          <MenuItem key={_chain.id} value={_chain.id}>
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

export const ProjectBlockchainSelect = forwardRef(SelectField);
