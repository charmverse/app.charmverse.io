import { Link, Typography } from '@mui/material';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '../../common/List';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function LitProtocolPage() {
  return (
    <InfoPageContainer data-test='partner-lit-page' image='/images/info/rewards-partner-lit.png' title='Lit Protocol'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>
        Lit Protocol is partnering with Scout Game to support builders who contribute to the ecosystem. There will be a
        total prize pool of $1,000 up for grabs for builders who complete qualified issues ranked by level of
        difficulty:
      </Typography>
      <List>
        <ListItem>Beginner: $50 USDC</ListItem>
        <ListItem>Intermediate: $100 USDC</ListItem>
        <ListItem>Advanced: $250 USDC</ListItem>
      </List>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        Devs will be rewarded for each PR merged that addresses one of the qualified issues (marked ‘good first issue’)
        in the Lit JS SDK repo.
      </Typography>
      <Typography>
        <Link href='https://github.com/LIT-Protocol/js-sdk' target='_blank' rel='noreferrer'>
          https://github.com/LIT-Protocol/js-sdk
        </Link>
      </Typography>
    </InfoCard>
  );
}
