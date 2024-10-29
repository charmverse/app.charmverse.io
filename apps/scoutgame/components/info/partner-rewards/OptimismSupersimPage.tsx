import { Link, Typography } from '@mui/material';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from 'components/common/DocumentPageContainer/components/List';
import { InfoPageContainer } from 'components/info/components/InfoPageContainer';

export function OptimismSupersimPage() {
  return (
    <InfoPageContainer
      data-test='partner-optimism-supersim-page'
      image='/images/info/rewards-partner-optimism-supersim.webp'
      title='Optimism Supersim'
    >
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography variant='h6' color='secondary' mt={2}>
        Summary
      </Typography>
      <Typography>
        Optimism is rewarding builders who help grow the{' '}
        <Link href='https://github.com/ethereum-optimism/supersim' target='_blank'>
          Supersim
        </Link>{' '}
        repo!
      </Typography>
      <Typography>
        Supersim is a lightweight tool, being built in the open, to simulate the Superchain locally. Supersim allows
        developers to spin up multiple local nodes with one command as well as to simulate op-stack functionality. The
        multichain development workflow brings complexity and new challenges, but Supersim helps developers build out
        their ideas faster.
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        Merge PRs to address issues in the Supersim repository labeled as{' '}
        <Link
          href='https://github.com/ethereum-optimism/supersim/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22'
          target='_blank'
        >
          good first issue
        </Link>{' '}
        and/or{' '}
        <Link
          href='https://github.com/ethereum-optimism/supersim/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22'
          target='_blank'
        >
          help wanted
        </Link>
        .
      </Typography>
      <Typography>
        For those more adventurous, a builder can create an issue in the repository detailing their proposed
        contribution before starting work. OP will respond to new issues and let the builder know if a PR would be
        accepted! Here are high priority additional desired features:
      </Typography>
      <List>
        <ListItem>Additional examples (see /examples/tic-tac-toe) showcasing projects to build with Supersim</ListItem>
        <ListItem>Improvements and additions to documentation</ListItem>
        <ListItem>
          Additional integrations (see /integrations/hyperland) showcasing services that can be run locally alongside
          Supersim to provide an even better local development experience
        </ListItem>
      </List>
    </InfoCard>
  );
}
