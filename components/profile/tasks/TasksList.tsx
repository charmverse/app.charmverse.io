import { useEffect } from 'react';
import styled from '@emotion/styled';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import useGnosisTasks, { GnosisTask } from './hooks/useGnosisTasks';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

export default function TasksList () {

  const gnosisTasks = useGnosisTasks();

  if (!gnosisTasks) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  return (
    <Table size='small' aria-label='simple table'>
      <TableHead>
        <TableRow>
          <StyledTableCell sx={{ px: 0 }}>Date</StyledTableCell>
          <StyledTableCell>My Tasks</StyledTableCell>
          <StyledTableCell>Type</StyledTableCell>
          <StyledTableCell>Workspace</StyledTableCell>
          <StyledTableCell></StyledTableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {
          gnosisTasks.map((task: GnosisTask) => (
            <TableRow key={`task-row-${task.id}`}>
              <TableCell sx={{ px: 0 }}>{new Date(task.date).toLocaleDateString()}</TableCell>
              <TableCell>
                {task.nonce} - {task.description} <br />
                Gnosis <Link target='_blank' href={task.gnosisUrl} external><OpenInNewIcon /></Link>
              </TableCell>
              <TableCell><Chip label='Multisig' variant='outlined' /></TableCell>
              <TableCell>CharmVerse</TableCell>
              <TableCell><Chip component={Link} label='Sign' variant='outlined' href={task.gnosisUrl} external target='_blank' /></TableCell>
            </TableRow>
          ))
        }
      </TableBody>
    </Table>
  );
}
