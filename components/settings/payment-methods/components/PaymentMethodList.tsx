import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Tooltip from '@mui/material/Tooltip';
import TableRow from 'components/common/Table/TableRow';
import { getChainById, getChainExplorerLink } from 'connectors';
import { PaymentMethod } from '@prisma/client';
import { useUser } from 'hooks/useUser';
import { useState } from 'react';
import { ElementDeleteIcon } from 'components/common/form/ElementDeleteIcon';
import { shortenHex } from 'lib/utilities/strings';
import Link from 'components/common/Link';
import CompositeDeletePaymentMethod from './DeletePaymentMethodModal';

interface IProps {
  paymentMethods: PaymentMethod[]
}

const getGnosisSafeUrl = (address: string) => `https://gnosis-safe.io/app/rin:${address}/balances`;

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
            <TableCell sx={{ px: 0 }}>Token</TableCell>
            <TableCell>{/* Logo */}</TableCell>
            <TableCell>Blockchain</TableCell>
            <TableCell>Wallet Type</TableCell>
            <TableCell>{/* Delete */}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedMethods.map((row) => (
            <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ px: 0 }}>
                {row.contractAddress ? (
                  <Tooltip arrow placement='top' title={`Contract address: ${shortenHex(row.contractAddress)}`}>
                    <span>
                      <Link href={getChainExplorerLink(row.chainId, row.contractAddress, 'token')} external target='_blank'>
                        {row.tokenName} ({row.tokenSymbol})
                      </Link>
                    </span>
                  </Tooltip>
                ) : (
                  `${row.tokenName} (${row.tokenSymbol})`
                )}
              </TableCell>
              <TableCell width={54}>
                {
                  row.tokenLogo && (
                    <img
                      style={{ maxWidth: '100%' }}
                      src={row.tokenLogo as string}
                    />
                  )
                }
              </TableCell>
              <TableCell>
                {getChainById(row.chainId)?.chainName}
              </TableCell>
              <TableCell>
                {
                  row.gnosisSafeAddress ? (
                    <Tooltip arrow placement='top' title={`Safe address: ${shortenHex(row.gnosisSafeAddress)}`}>
                      <span>
                        <Link href={getGnosisSafeUrl(row.gnosisSafeAddress)} external target='_blank'>
                          Gnosis Safe
                        </Link>
                      </span>
                    </Tooltip>
                  ) : (
                    'MetaMask'
                  )
                }
              </TableCell>
              <TableCell width={150} sx={{ px: 0 }} align='right'>

                {
                isAdmin && (
                  <ElementDeleteIcon onClick={() => setPaymentMethodIdToDelete(row.id)} />
                )
              }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
