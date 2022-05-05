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
import { Link as TaskLink, Task } from 'models';
import { useTasks } from 'hooks/useTasks';
import useGnosisSafes from 'hooks/useGnosisSafes';
import useGnosisService from 'hooks/useGnosisService';
import SafeServiceClient from '@gnosis.pm/safe-service-client';
import useSWR from 'swr';
import charmClient from 'charmClient';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

export default function TasksList () {

  const { data } = useSWR('/profile/multi-sigs', () => charmClient.listUserMultiSigs());
  const safes = useGnosisSafes(data?.map(s => s.address) || []);
  const service = useGnosisService();
  console.log(data, service);
  const tasks = useTasks();

  useEffect(() => {
    if (data && service) {
      getServiceTaskQueue(service, data.map(s => s.address));
    }
  }, [!!data, service]);

  async function getServiceTaskQueue (_service: SafeServiceClient, addresses: string[]) {
    const results = await Promise.all(addresses.map(address => {
      console.log('retrieve', address);
      return _service.getAllTransactions(address)
        .catch(err => {
          console.error(err);
          return null;
        });
    }));
    console.log('service results', results);
  }

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
                {task.links.map((link: TaskLink, _linkIndex: number) => (
                  <span key={`link-${link.id}`}>
                    [{link.name}<Link target='_blank' href={link.url} external><OpenInNewIcon /></Link>]
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
