import { ListItemIcon, ListItemText, MenuItem, Select } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import type { IChainDetails } from '@root/connectors/chains';
import { getChainById, getChainList } from '@root/connectors/chains';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import { BlockchainLogo } from './BlockchainLogo';

function SelectField(
  props: SelectProps<string> & { helperMessage?: ReactNode; chains?: IChainDetails[] },
  ref: Ref<unknown>
) {
  const { helperMessage, chains: chainsProp, ...restProps } = props;

  const chainList = chainsProp || getChainList({ enableTestnets: false });

  return (
    <Select<string>
      fullWidth
      displayEmpty
      renderValue={(selected) => getChainById(Number(selected))?.chainName || 'Select a Chain'}
      ref={ref}
      {...restProps}
    >
      {chainList.map((_chain, _index, _arr) => {
        // We add a divider to separate mainnets from testnets
        const isFirstTestnet = _arr.findIndex((c) => !!c.testnet) === _index;

        return (
          <MenuItem
            key={_chain.chainId}
            value={_chain.chainId}
            sx={isFirstTestnet ? { borderTop: (theme) => `2px solid ${theme.palette.divider}`, pt: 1 } : undefined}
          >
            <ListItemIcon>
              <BlockchainLogo height={20} src={_chain.iconUrl} />
            </ListItemIcon>
            <ListItemText>{_chain.chainName}</ListItemText>
          </MenuItem>
        );
      })}
    </Select>
  );
}

export const ProjectBlockchainSelect = forwardRef(SelectField);
