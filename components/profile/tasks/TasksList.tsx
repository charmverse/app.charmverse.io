/* eslint-disable jsx-a11y/control-has-associated-label */
import styled from '@emotion/styled';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import bounties from 'pages/api/bounties';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

export enum TaskType {
  bounty = 'Bounty',
  multisig = 'Multisig',
}

export type Link = {id: string; name: string; url:string;};

export type Task = {
  id: string;
  date: Date;
  description: string;
  links: Link[];
  type: TaskType;
  workspace: string;
};

type TasksListProps = {
  tasks: Task[];
};

export function TasksList ({ tasks }: TasksListProps) {

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
              <TableCell sx={{ px: 0 }}>{task.date.toLocaleDateString()}</TableCell>
              <TableCell>
                {task.description} <br />
                {task.links.map((link: Link, _linkIndex: number) => (
                  <span key={`link-${link.id}`}>
                    [{link.name}<a href={link.url}><OpenInNewIcon /></a>]
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
