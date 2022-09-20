import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Tooltip from '@mui/material/Tooltip';
import type { PaymentMethod } from '@prisma/client';
import ElementDeleteIcon from 'components/common/form/ElementDeleteIcon';
import Link from 'components/common/Link';
import TableRow from 'components/common/Table/TableRow';
import TokenLogo from 'components/common/TokenLogo';
import { getChainExplorerLink } from 'connectors';
import useIsAdmin from 'hooks/useIsAdmin';
import { getTokenAndChainInfo } from 'lib/tokens/tokenData';
import { shortenHex } from 'lib/utilities/strings';
import { useState } from 'react';
import CompositeDeletePaymentMethod from './DeletePaymentMethodModal';

interface IProps {
  paymentMethods: PaymentMethod[]
}

const getGnosisSafeUrl = (address: string) => `https://gnosis-safe.io/app/rin:${address}/balances`;

export default function CompositePaymentMethodList ({ paymentMethods }: IProps) {

  const [paymentMethodIdToDelete, setPaymentMethodIdToDelete] = useState<string | null>(null);

  const isAdmin = useIsAdmin();

  const tableRows = paymentMethods
    .map(method => ({ method, tokenInfo: getTokenAndChainInfo(method) }))
    .sort((methodA, methodB) => methodA.method.createdAt < methodB.method.createdAt ? -1 : 1);

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
          {tableRows.map(({ method, tokenInfo }) => (
            <TableRow key={method.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ px: 0 }}>
                {method.contractAddress ? (
                  <Tooltip arrow placement='top' title={`Contract address: ${shortenHex(method.contractAddress)}`}>
                    <span>
                      <Link href={getChainExplorerLink(method.chainId, method.contractAddress, 'address')} external target='_blank'>
                        {method.tokenName} ({method.tokenSymbol})
                      </Link>
                    </span>
                  </Tooltip>
                ) : (
                  `${method.tokenName} (${method.tokenSymbol})`
                )}
              </TableCell>
              <TableCell width={54}>
                <TokenLogo src={tokenInfo.canonicalLogo} />
              </TableCell>
              <TableCell>
                {tokenInfo.chain.chainName}
              </TableCell>
              <TableCell>
                {
                  method.gnosisSafeAddress ? (
                    <Tooltip arrow placement='top' title={`Safe address: ${shortenHex(method.gnosisSafeAddress)}`}>
                      <span>
                        <Link href={getGnosisSafeUrl(method.gnosisSafeAddress)} external target='_blank'>
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
                  <ElementDeleteIcon onClick={() => setPaymentMethodIdToDelete(method.id)} />
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
