import { useEffect } from 'react';
import styled from '@emotion/styled';
import { Alert, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import Legend from 'components/settings/Legend';
import { shortenHex } from 'lib/utilities/strings';
import useGnosisTasks, { GnosisTask } from './hooks/useGnosisTasks';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

function SafeTasks ({ address, safeUrl, tasks }: { address: string, safeUrl: string, tasks: GnosisTask[] }) {

  return (
    <>
      <Typography color='inherit'>
        Tasks from safe: <Link href={safeUrl} external target='_blank'>{shortenHex(address)} <OpenInNewIcon fontSize='small' /></Link>
      </Typography>
      <Table size='small' aria-label='simple table'>
        <TableHead>
          <TableRow>
            <StyledTableCell sx={{ pl: 0 }}></StyledTableCell>
            <StyledTableCell></StyledTableCell>
            <StyledTableCell></StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
          tasks.map((task: GnosisTask) => (
            <TableRow key={`task-row-${task.nonce}`}>
              <TableCell>{task.transactions[0].nonce}</TableCell>
              <TableCell>
                {task.transactions[0].description} <br />
              </TableCell>
              <TableCell align='right'>
                <Chip
                  clickable
                  component={Link}
                  external
                  label={task.transactions[0].action}
                  href={task.transactions[0].actionUrl}
                  target='_blank'
                  variant='outlined'
                />
              </TableCell>
            </TableRow>
          ))
        }
        </TableBody>
      </Table>
    </>
  );
}

export default function GnosisTasksSection () {

  const { error, tasks: safesWithTasks } = useGnosisTasks();

  return (
    <>
      <Legend>Multisig</Legend>
      {error && (
        <Alert severity='error'>
          There was an error: {error}
        </Alert>
      )}
      {safesWithTasks && safesWithTasks.map(safe => (
        <SafeTasks
          key={safe.safeAddress}
          address={safe.safeAddress}
          tasks={safe.tasks}
          safeUrl={safe.safeUrl}
        />
      ))}
      {!safesWithTasks && <LoadingComponent height='200px' isLoading={true} />}
    </>
  );
}
