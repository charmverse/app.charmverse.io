import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import { Blockquote } from 'components/common/DocumentPageContainer/components/Blockquote';
import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function WeeklyRewardsPage() {
  return (
    <InfoPageContainer
      data-test='weekly-rewards-page'
      image='/images/info/info_banner.png'
      title='Weekly Builder Ranking & Reward Allocation'
    >
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>
        Scout Game runs in seasons. Each season is 13 weeks. During each week, Builders collect Scout Gems by completing
        qualified actions.
      </Typography>
      <Table sx={{ '& *': { px: 0 } }} aria-label='action table'>
        <TableHead>
          <TableRow>
            <TableCell>Action</TableCell>
            <TableCell align='right'>Reward</TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ '& td, & th': { border: 0 } }}>
          <TableRow>
            <TableCell>One commit to a Qualified GitHub Repository (max 1 gem per day)</TableCell>
            <TableCell align='center'>1</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>One merged Pull Request in a Qualified GitHub Repository</TableCell>
            <TableCell align='center'>10</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              3rd Pull Request of a streak of 3 Merged Pull Requests in Qualified GitHub Repositories within a sliding
              7-day window
            </TableCell>
            <TableCell align='center'>30</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>First Pull Request in a Qualified GitHub Repository</TableCell>
            <TableCell align='center'>100</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Typography>A Builder may only score Gems for one PR per approved repo per day.</Typography>
      <Typography>Gem rewards do not stack. The maximum score for a single PR is 100 Gems.</Typography>
      <Typography>
        At the end of each week, Builders are ranked by the number of Gems they collected that week. Scout Points are
        allocated to the top-ranking Builders and the Scouts who hold their NFTs according to this formula:
      </Typography>
      <Blockquote>
        <Typography align='center' my={1}>
          <code>
            Reward<sub>R</sub> = A X [(1 - D)<sup>^(R-1)</sup> - (1 - D)<sup>^R</sup>]
          </code>
        </Typography>
        <Typography>Where</Typography>
        <Typography>
          A = Total Scout Point Allocation for the Week
          <br />R = Rank
          <br />D = Decay Rate = 3%
        </Typography>
      </Blockquote>
      <Typography>The reward is split between the Builder and their scouts as follows:</Typography>
      <Typography>
        Builder<sub>R</sub> Reward = 20% x Reward<sub>R</sub>
      </Typography>
      <Blockquote>
        <Typography>
          Scout<sub>R,H</sub> Reward = 80% x (H / S) x Reward<sub>R</sub>
        </Typography>
        <Typography>Where</Typography>
        <Typography>
          R = Builder's rank that week
          <br />H = Number of the Builder's NFTs owned by the Scout
          <br />S = Total number of the Builder's NFTs minted
        </Typography>
      </Blockquote>
      <Typography>A Builder's Gem count resets to zero at the start of each week.</Typography>
    </InfoCard>
  );
}
