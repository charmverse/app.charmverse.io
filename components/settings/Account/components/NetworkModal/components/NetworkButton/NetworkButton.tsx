import Box from '@mui/material/Box';
import Button from 'components/common/Button';
import Tooltip from '@mui/material/Tooltip';
import styled from '@emotion/styled';
import { useWeb3React } from '@web3-react/core';
import { Chains, RPC } from 'connectors';
import { greyColor2 } from 'theme/colors';

type Props = {
  chain: any,
  requestNetworkChange: () => void
}

const ImageIcon = styled.img`
  width: 1.5rem;
  height: 1.5rem;
`;

function NetworkButton ({ chain, requestNetworkChange }: Props) {
  const { chainId } = useWeb3React();

  // @ts-ignore
  const isCurrentChain = Chains[chain] === chainId;

  return (
    <Tooltip
      disableHoverListener={!isCurrentChain}
      // @ts-ignore
      title={`${RPC[chain].chainName} is currently selected`}
    >
      <Box>
        <Button
          startIcon={(
            // @ts-ignore
            <ImageIcon src={RPC[chain].iconUrls[0]} />
          )}
          color='secondary'
          variant='outlined'
          disabled={isCurrentChain}
          onClick={requestNetworkChange}
          fullWidth
          size='large'
          sx={{ color: isCurrentChain ? `${greyColor2} !important` : 'inherit', justifyContent: 'flex-start' }}
        >
          {/* @ts-ignore */}
          {RPC[chain].chainName}
        </Button>
      </Box>
    </Tooltip>
  );
}

export default NetworkButton;
