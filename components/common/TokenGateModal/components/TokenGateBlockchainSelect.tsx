import type { SelectProps } from '@mui/material';
import { FormHelperText, ListItemIcon, ListItemText, MenuItem, Select } from '@mui/material';
import type { IChainDetails } from 'connectors/chains';
import { getChainById, litChains } from 'connectors/chains';
import type { ReactNode } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import TokenLogo from 'components/common/TokenLogo';

export function TokenGateBlockchainSelect(
  props: SelectProps<string> & { helperMessage?: ReactNode; chains?: IChainDetails[] }
) {
  const { helperMessage, children, chains = litChains } = props;

  return (
    <FieldWrapper label='Blockchain'>
      <Select<string>
        fullWidth
        displayEmpty
        renderValue={(selected) => getChainById(Number(selected))?.chainName || 'Select a Chain'}
        {...props}
      >
        {children ||
          chains.map((_chain, _index, _arr) => {
            // We add a divider to separate mainnets from testnets
            const isFirstTestnet = _arr.findIndex((c) => !!c.testnet) === _index;

            return (
              <MenuItem
                key={_chain.chainId}
                value={_chain.chainId}
                sx={isFirstTestnet ? { borderTop: (theme) => `2px solid ${theme.palette.divider}`, pt: 1 } : undefined}
              >
                <ListItemIcon>
                  <TokenLogo height={20} src={_chain.iconUrl} />
                </ListItemIcon>
                <ListItemText>{_chain.chainName}</ListItemText>
              </MenuItem>
            );
          })}
      </Select>
      {helperMessage && <FormHelperText>{helperMessage}</FormHelperText>}
    </FieldWrapper>
  );
}
