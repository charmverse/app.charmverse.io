import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function OptimismPage() {
  return (
    <InfoPageContainer
      data-test='partner-optimism-page'
      image='/images/info/rewards-partner-optimism.png'
      title='Optimism'
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
        Optimism is partnering with Scout Game to reward new Scouts for playing the game! Each week, new Scouts will
        compete for a chance to win a share of 500 OP!
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        Scouts that purchase their FIRST Builder Card during the week will be eligible for that week's New Scout
        competition. New Scouts will compete with each other to earn the most Scout Points during their first week
        playing the game. The Top 10 point earners will be awarded OP, from a weekly pool of 500 OP, as follows:
      </Typography>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell align='right'>Reward</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
            <TableCell align='right'>100 OP</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>2</TableCell>
            <TableCell align='right'>80 OP</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>3</TableCell>
            <TableCell align='right'>70 OP</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>4</TableCell>
            <TableCell align='right'>60 OP</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>5</TableCell>
            <TableCell align='right'>50 OP</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>6</TableCell>
            <TableCell align='right'>40 OP</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>7</TableCell>
            <TableCell align='right'>35 OP</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>8</TableCell>
            <TableCell align='right'>25 OP</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>9</TableCell>
            <TableCell align='right'>20 OP</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>10</TableCell>
            <TableCell align='right'>20 OP</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </InfoCard>
  );
}
