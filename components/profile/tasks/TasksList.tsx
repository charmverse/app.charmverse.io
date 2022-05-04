/* eslint-disable jsx-a11y/control-has-associated-label */
import styled from '@emotion/styled';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link, Task } from 'models';
import { useTasks } from 'hooks/useTasks';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

export default function TasksList () {

  const tasks = useTasks();

  const handleSign = () => {
  };

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
          tasks.map((task: Task, _taskIndex: number) => (
            <TableRow key={`task-row-${task.id}`}>
              <TableCell sx={{ px: 0 }}>{new Date(task.date).toLocaleDateString()}</TableCell>
              <TableCell>
                {task.description} <br />
                {task.links.map((link: Link, _linkIndex: number) => (
                  <span key={`link-${link.id}`}>
                    [{link.name}<a target='_blank' href={link.url} rel='noreferrer'><OpenInNewIcon /></a>]
                  </span>
                ))}
              </TableCell>
              <TableCell><Chip label={task.type} variant='outlined' /></TableCell>
              <TableCell>{task.workspace}</TableCell>
              <TableCell><Chip label='Sign' variant='outlined' onClick={handleSign} /></TableCell>
            </TableRow>
          ))
        }
      </TableBody>
    </Table>
  );
}
