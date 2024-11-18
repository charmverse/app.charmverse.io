import { Typography } from '@mui/material';
import Link from 'next/link';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '../../common/List';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function SpamPolicyPage() {
  return (
    <InfoPageContainer data-test='spam-policy-page' image='/images/info/info_banner.png' title='Spam Policy'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>Scout Game automatically detects REJECTED Pull Requests from Builders.</Typography>
      <List>
        <ListItem>
          <Typography>Each rejected Pull Request is treated as an abuse report.</Typography>
        </ListItem>
        <ListItem>
          <Typography>Qualified GitHub repo owners may report abuse in Scout Game.</Typography>
        </ListItem>
        <ListItem>
          <Typography>Scout Game core team may also report abuse.</Typography>
        </ListItem>
        <ListItem>
          <Typography>
            Builders receiving 3 abuse reports will be suspended from the Scout Game and unable to score points
          </Typography>
        </ListItem>
        <ListItem>
          <Typography>
            A suspended Builder may appeal to rejoin the Scout Game.
            <br /> Submit an appeal here:{' '}
            <Link href='https://appeal.scoutgame.xyz' target='_blank'>
              https://appeal.scoutgame.xyz
            </Link>
          </Typography>
        </ListItem>
      </List>
    </InfoCard>
  );
}
