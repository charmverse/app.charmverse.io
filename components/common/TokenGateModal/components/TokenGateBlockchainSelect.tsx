import { FormHelperText, ListItemIcon, ListItemText, MenuItem, Select } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import { getChainById, getChainList } from 'connectors/chains';
import type { IChainDetails } from 'connectors/chains';
import { forwardRef } from 'react';
import type { Ref, ReactNode } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import TokenLogo from 'components/common/TokenLogo';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { isAnkrChain } from 'lib/blockchain/provider/ankr/config';

function SelectField(
  props: SelectProps<string> & { helperMessage?: ReactNode; chains?: IChainDetails[] },
  ref: Ref<unknown>
) {
  const { helperMessage, chains: chainsProp, ...restProps } = props;

  const { space } = useCurrentSpace();
  const chainList =
    chainsProp ||
    getChainList({ enableTestnets: !!space?.enableTestnets }).filter(
      (chain) => !!chain.alchemyUrl || isAnkrChain(chain.chainId)
    );

  return (
    <FieldWrapper label='Blockchain'>
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

export const TokenGateBlockchainSelect = forwardRef(SelectField);
