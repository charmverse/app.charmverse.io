import { Link, Typography } from '@mui/material';
import NextLink from 'next/link';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '../../common/List';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function PartnerRewardsPage() {
  return (
    <InfoPageContainer data-test='partner-rewards-page' image='/images/info/info_banner.png' title='Partner Rewards'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard title='Partner Rewards'>
      <Typography>
        Scout Game is partnering with Celo, Game7, Moxie and Bountycatser to reward builders for doing what they do
        best! Find details about each partnership on the following pages:
      </Typography>
      <List>
        <ListItem>
          <Link component={NextLink} href='/info/partner-rewards/celo'>
            Celo
          </Link>
        </ListItem>
        <ListItem>
          <Link component={NextLink} href='/info/partner-rewards/game7'>
            Game7
          </Link>
        </ListItem>
        <ListItem>
          <Link component={NextLink} href='/info/partner-rewards/moxie'>
            Moxie
          </Link>
        </ListItem>
        <ListItem>
          <Link component={NextLink} href='/info/partner-rewards/bountycaster'>
            BountyCaster
          </Link>
        </ListItem>
        <ListItem>
          <Link component={NextLink} href='/info/partner-rewards/lit'>
            Lit Protocol
          </Link>
        </ListItem>
        <ListItem>
          <Link component={NextLink} href='/info/partner-rewards/optimism'>
            Optimism
          </Link>
        </ListItem>
        <ListItem>
          <Link component={NextLink} href='/info/partner-rewards/op-supersim'>
            Optimism Supersim
          </Link>
        </ListItem>
      </List>
    </InfoCard>
  );
}
