import { Link, Typography } from '@mui/material';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from 'components/common/DocumentPageContainer/components/List';

import { InfoPageContainer } from '../InfoPageContainer';

export function BuildersPage() {
  return (
    <InfoPageContainer data-test='builders-page' image='/images/info/info_banner.png' title='How it works for Builders'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>Join the Scout Game as a Builder and connect your GitHub account.</Typography>
      <Typography>
        Builders in the Scout Game gain recognition by actively contributing to approved projects. Each season lasts
        three months, and builders earn Scout Gems weekly by completing specific tasks tied to their contributions. At
        the end of each week, Scout Gems are converted to Scout Points depending on the Builder’s rank.
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        Key Builder Actions:
      </Typography>
      <div>
        <Typography>Collect Gems for completing qualified actions:</Typography>
        <List>
          <ListItem>Commit code to an approved open-source project</ListItem>
          <ListItem>Contribute to approved open-source projects with an accepted Pull Request</ListItem>
          <ListItem>Make your mark with a first-time code contribution to an approved project</ListItem>
          <ListItem>Hit a 3-Pull Request streak within 7 days</ListItem>
        </List>
      </div>
      <div>
        <Typography>Approved Open-Source Project Owners</Typography>
        <List>
          <ListItem>
            <Link
              href='https://docs.google.com/spreadsheets/d/1K-p1ekVWzc062Z9xlmObwWSjjt5aWLeZZL3zS0e77DE/edit?usp=sharing'
              target='_blank'
              rel='noopener noreferrer'
              sx={{ wordBbreak: 'break-word' }}
            >
              https://docs.google.com/spreadsheets/d/1K-p1ekVWzc062Z9xlmObwWSjjt5aWLeZZL3zS0e77DE/edit?usp=sharing
            </Link>
          </ListItem>
        </List>
      </div>
    </InfoCard>
  );
}
