import { Typography } from '@mui/material';

import { Blockquote } from '../../common/DocumentPageContainer/components/Blockquote';
import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function BuilderNftsPage() {
  return (
    <InfoPageContainer data-test='builder-nfts-page' image='/images/info/info_banner.png' title='Builder NFTs'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>
        Builder NFTs can be purchased with Eth, USDC, or USDT on Base, OP or Arb. Scout Points can also be used to
        purchase Builder NFTs. Builders receive 20% of the proceeds from their NFT sales in Scout Points.
      </Typography>
      <Typography>
        The price of a Builder's first NFT mint is 20 Scout Points. The price of the next NFT of the same Builder is
        calculated as follows:
      </Typography>
      <Blockquote>
        <Typography align='center' my={1}>
          <code>P = 20 x S + 20</code>
        </Typography>
        <Typography>Where:</Typography>
        <Typography>
          P: Price of the NFT (Scout Points)
          <br />
          S: Current supply (number of NFTs minted)
        </Typography>
      </Blockquote>
      <Typography>Season 1 Builder NFTs are non-transferable.</Typography>
    </InfoCard>
  );
}
