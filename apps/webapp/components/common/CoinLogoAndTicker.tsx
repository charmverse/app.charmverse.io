import styled from '@emotion/styled';
import { Stack } from '@mui/material';

import type { TokenInfo } from '@packages/lib/tokens/tokenData';

const StyledImg = styled.img`
  width: 1em;
`;

type CoinLogoAndTickerProps = TokenInfo;

export function CoinLogoAndTicker({ tokenSymbol, tokenLogo }: CoinLogoAndTickerProps) {
  return (
    <Stack direction='row' alignItems='center' spacing={0.5}>
      {tokenLogo && <StyledImg src={tokenLogo as string} />}
      <span>{tokenSymbol}</span>
    </Stack>
  );
}
