import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { StyledRow } from 'components/settings/TokenGatesTable';
import { getChainById, getChainExplorerLink } from 'connectors';
import { PaymentMethod } from '@prisma/client';
import { useUser } from 'hooks/useUser';
import { useState } from 'react';
import { ElementDeleteIcon } from 'components/common/form/ElementDeleteIcon';
import Link from 'components/common/Link';
import CompositeDeletePaymentMethod from './DeletePaymentMethodModal';

interface IProps {
  paymentMethods: PaymentMethod[]
}

export default function CompositePaymentMethodList ({ paymentMethods }: IProps) {

  const [user] = useUser();
  const [paymentMethodIdToDelete, setPaymentMethodIdToDelete] = useState<string | null>(null);

  const isAdmin = user?.spaceRoles.some(spaceRole => spaceRole.role === 'admin') === true;

  const sortedMethods = [...paymentMethods]
    .sort((methodA, methodB) => {
      if (methodA.chainId < methodB.chainId) {
        return -1;
      }
      else if (methodA.chainId > methodB.chainId) {
        return 1;
      }
      else {
        return 0;
      }
    });

  return (

    <>
      <CompositeDeletePaymentMethod
        open={paymentMethodIdToDelete !== null}
        paymentMethodIdToDelete={paymentMethodIdToDelete}
        onClose={() => {
          setPaymentMethodIdToDelete(null);
        }}
      />

      <Table size='small' aria-label='simple table'>
        <TableHead>
          <TableRow>

            <TableCell>Symbol</TableCell>
            <TableCell>{/* Logo */}</TableCell>
            <TableCell>Name</TableCell>
            <TableCell sx={{ px: 0 }}>Blockchain</TableCell>

            <TableCell>{/* Delete */}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedMethods.map((row) => (
            <StyledRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>

              <TableCell width={100}>
                <Typography>
                  {row.tokenSymbol}
                </Typography>
              </TableCell>
              <TableCell width={80}>
                {
                row.tokenLogo && (
                  <img
                    alt=''
                    style={{ maxHeight: '50px' }}
                    src={row.tokenLogo as string}
                  />
                )
              }
              </TableCell>
              <TableCell width={300}>
                <Box component='span' sx={{ display: 'inline' }}>

                  <Typography>
                    {row.tokenName}

                  </Typography>

                </Box>

              </TableCell>
              <TableCell width={200} sx={{ px: 0 }}>
                <Typography>
                  {row.contractAddress ? (
                    <Link href={getChainExplorerLink(row.chainId, row.contractAddress, 'token')} external>
                      {getChainById(row.chainId)?.chainName}
                    </Link>
                  ) : (
                    getChainById(row.chainId)?.chainName
                  )}
                </Typography>
              </TableCell>
              <TableCell width={150} sx={{ px: 0 }} align='center'>

                {
                isAdmin && (
                  <ElementDeleteIcon clicked={() => setPaymentMethodIdToDelete(row.id)} />
                )
              }
              </TableCell>
            </StyledRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
