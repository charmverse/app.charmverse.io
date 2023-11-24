import type { SelectProps } from '@mui/material';
import { FormHelperText, ListItemIcon, ListItemText, MenuItem, Select } from '@mui/material';
import { getChainDetailsFromLitNetwork, litChains } from 'connectors/chains';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import TokenLogo from 'components/common/TokenLogo';

export function TokenGateBlockchainSelect(props: SelectProps<string> & { helperMessage?: string }) {
  const { helperMessage, children } = props;

  return (
    <FieldWrapper label='Blockchain'>
      <Select<string>
        fullWidth
        displayEmpty
        renderValue={(selected) => getChainDetailsFromLitNetwork(selected)?.chainName || selected || 'Select a Chain'}
        {...props}
      >
        {children ||
          litChains.map((_chain, _index, _arr) => {
            // We add a divider to separate mainnets from testnets
            const isFirstTestnet = _arr.findIndex((c) => !!c.testnet) === _index;

            return (
              <MenuItem
                key={_chain.chainName}
                value={_chain.litNetwork}
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
