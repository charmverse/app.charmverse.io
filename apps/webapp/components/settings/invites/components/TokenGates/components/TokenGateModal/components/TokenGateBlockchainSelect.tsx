import type { Space } from '@charmverse/core/prisma';
import { FormHelperText, ListItemIcon, ListItemText, MenuItem, Select } from '@mui/material';
import type { SelectProps } from '@mui/material/Select';
import type { IChainDetails } from '@packages/blockchain/connectors/chains';
import { getChainById, getChainList } from '@packages/blockchain/connectors/chains';
import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { BlockchainLogo } from 'components/common/Icons/BlockchainLogo';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useTokenGateAccess } from 'hooks/useTokenGateAccess';

function SelectField(
  props: SelectProps<string> & { helperMessage?: ReactNode; chains?: IChainDetails[] },
  ref: Ref<unknown>
) {
  const { helperMessage, chains: chainsProp, ...restProps } = props;

  const { space } = useCurrentSpace();
  const { allowedChains } = useTokenGateAccess({ space: space as Space });
  const chainList = chainsProp || getChainList({ enableTestnets: !!space?.enableTestnets });

  // Filter chains based on subscription tier restrictions
  const filteredChainList = allowedChains
    ? chainList.filter((chain) =>
        allowedChains.includes(chain.chainName.toLowerCase() as (typeof allowedChains)[number])
      )
    : chainList;

  return (
    <FieldWrapper label='Blockchain'>
      <Select<string>
        fullWidth
        displayEmpty
        renderValue={(selected) => getChainById(Number(selected))?.chainName || 'Select a Chain'}
        ref={ref}
        {...restProps}
      >
        {filteredChainList.map((_chain, _index, _arr) => {
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
      {helperMessage && <FormHelperText>{helperMessage}</FormHelperText>}
    </FieldWrapper>
  );
}

export const TokenGateBlockchainSelect = forwardRef(SelectField);
