import Box from '@mui/material/Box';
import Button from 'components/common/Button';
import Tooltip from '@mui/material/Tooltip';
import styled from '@emotion/styled';
import { useWeb3React } from '@web3-react/core';
import { RPC, Blockchain } from 'connectors';
import { greyColor2 } from 'theme/colors';

type Props = {
  chain: Blockchain;
  requestNetworkChange: () => void;
}

const ImageIcon = styled.img`
  width: auto;
  height: 1.5rem;
`;

function NetworkButton ({ chain, requestNetworkChange }: Props) {
  const { chainId } = useWeb3React();

  const isCurrentChain = RPC[chain].chainId === chainId;

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
            <ImageIcon src={RPC[chain]?.iconUrl} />
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
