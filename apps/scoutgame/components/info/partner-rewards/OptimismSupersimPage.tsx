import {
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

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
        Optimism is rewarding builders, from a pool of 5,000 OP, who help grow the{' '}
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
      <Typography>Merge PRs to address issues in the Supersim repository to earn rewards.</Typography>
      <Typography>
        Earn 200 OP for a PR addressing an issue labeled as{' '}
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
        For those more adventurous, earn 200 to 500 OP for merging a PR addressing a new issue. Create an issue in the
        repository detailing your proposed contribution before starting work. OP will respond to new issues and let the
        you know if a PR would be accepted! Here are high priority additional desired features:
      </Typography>
      <List>
        <ListItem>Additional examples (see /examples/tic-tac-toe) showcasing projects to build with Supersim</ListItem>
        <ListItem>Improvements and additions to documentation</ListItem>
        <ListItem>
          Additional integrations (see /integrations/hyperland) showcasing services that can be run locally alongside
          Supersim to provide an even better local development experience
        </ListItem>
      </List>
      <TableContainer component={Paper}>
        <Table sx={{ '& th, & td': { px: 0 } }} aria-label='Celo tiers table'>
          <TableHead>
            <TableRow>
              <TableCell>Issue</TableCell>
              <TableCell align='right'>Reward</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ '& td, & th': { border: 0 } }}>
            <TableRow>
              <TableCell>
                <Link
                  href='https://github.com/ethereum-optimism/supersim/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22'
                  target='_blank'
                >
                  good first issue
                </Link>
              </TableCell>
              <TableCell align='right'>200 OP</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Link
                  href='https://github.com/ethereum-optimism/supersim/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22'
                  target='_blank'
                >
                  help wanted
                </Link>
              </TableCell>
              <TableCell align='right'>200 OP</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Create your own*</TableCell>
              <TableCell align='right'>200 to 500 OP**</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Typography>*See list of high priority additional features above for inspiration.</Typography>
      <Typography>**Optimism will determine the reward based on the complexity and priority of the issue.</Typography>
    </InfoCard>
  );
}
