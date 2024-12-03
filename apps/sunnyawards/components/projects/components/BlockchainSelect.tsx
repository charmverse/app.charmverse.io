import { ListItemIcon, ListItemText, MenuItem, Select } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import Image from 'next/image';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

const chainOptions: { name: string; id: number; icon: string }[] = [
  { name: 'Optimism', id: 10, icon: '/images/crypto/op.png' },
  { name: 'Zora', id: 7777777, icon: '/images/crypto/zora64.png' },
  { name: 'Base', id: 8453, icon: '/images/crypto/base64.png' },
  { name: 'Mode', id: 34443, icon: '/images/crypto/mode64.png' },
  { name: 'Lisk', id: 1135, icon: '/images/crypto/lisk64.png' },
  { name: 'Metal', id: 1750, icon: '/images/crypto/metal64.png' },
  { name: 'Mint', id: 185, icon: '/images/crypto/mint64.png' },
  { name: 'Fraxtal', id: 2522, icon: '/images/crypto/frax64.png' },
  { name: 'Redstone', id: 690, icon: '/images/crypto/redstone64.png' },
  { name: 'Cyber', id: 7560, icon: '/images/crypto/cyber64.png' },
  { name: 'Polynomial', id: 8008, icon: '/images/crypto/polynomial.png' },
  { name: 'Xterio', id: 2702128, icon: '/images/crypto/xterio.png' },
  { name: 'Kroma', id: 255, icon: '/images/crypto/kroma.png' },
  { name: 'Swan', id: 254, icon: '/images/crypto/swan.png' },
  { name: 'BOB', id: 6080, icon: '/images/crypto/bob.png' },
  { name: 'Orderly Network', id: 291, icon: '/images/crypto/orderly.png' }
];

function SelectField(props: SelectProps<string> & { helperMessage?: ReactNode }, ref: Ref<unknown>) {
  const { helperMessage, ...restProps } = props;

  return (
    <Select<string>
      fullWidth
      displayEmpty
      renderValue={(selected) =>
        chainOptions.find(({ id }) => (selected as unknown as number) === id)?.name || 'Select a Chain'
      }
      ref={ref}
      {...restProps}
    >
      <MenuItem value='' disabled>
        Select a Chain
      </MenuItem>
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

export const BlockchainSelect = forwardRef(SelectField);
