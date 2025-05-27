import styled from '@emotion/styled';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import type { TokenGateWithRoles } from '@packages/lib/tokenGates/interfaces';
import { useState } from 'react';

import Loader from 'components/common/Loader';
import TableRow from 'components/common/Table/TableRow';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useWeb3Account } from 'hooks/useWeb3Account';

import { CopyLink } from './CopyLink';
import { TestConnectionModal } from './TestConnectionModal';
import { TokenGateMessageButton } from './TokenGateMessageButton';
import { TokenGateTableRow } from './TokenGatesTableRow';

interface Props {
  isAdmin: boolean;
  isLoading: boolean;
  tokenGates: TokenGateWithRoles[];
  refreshTokenGates: () => Promise<void>;
}

const StyledTableRow = styled(TableRow)`
  margin-bottom: 20px;
  background-color: ${({ theme }) => theme.palette.sidebar.background};

  & > th,
  & > td {
    border-bottom-style: dashed;
  }
`;

const padding = 32;

interface TableHeaderProps {
  isMobile: boolean;
  tokenGatesAvailable: boolean;
  spaceDomain?: string;
  isArchived?: boolean;
}

function TableHeader({ isMobile, tokenGatesAvailable, spaceDomain, isArchived }: TableHeaderProps) {
  return (
    <TableHead>
      <StyledTableRow>
        <TableCell sx={{ display: 'flex', gap: 3, p: 2, paddingRight: isMobile ? 0 : 2 }} colSpan={isMobile ? 2 : 0}>
          <Typography noWrap lineHeight='30px' variant='body1' fontWeight='600'>
            {isArchived ? 'Archived Token Gates' : 'Token Gated Link'}
          </Typography>
          {!isArchived && <TokenGateMessageButton />}
        </TableCell>
        {!isMobile && <TableCell width={150} />}
        {!isArchived && (
          <TableCell sx={{ width: 90 + padding }} align='center'>
            <CopyLink tokenGatesAvailable={tokenGatesAvailable} spaceDomain={spaceDomain} />
          </TableCell>
        )}
        <TableCell sx={{ width: 30 + padding }} />
        {isArchived ? <TableCell sx={{ width: 30 + padding }} /> : null}
      </StyledTableRow>
    </TableHead>
  );
}

interface TokenGatesListProps {
  gates: TokenGateWithRoles[];
  isLoading: boolean;
  isAdmin: boolean;
  spaceId?: string;
  account?: string | null;
  refreshTokenGates: () => Promise<void>;
  onTestConnect: (id: string) => void;
}

function TokenGatesList({
  gates,
  isLoading,
  isAdmin,
  spaceId,
  account,
  refreshTokenGates,
  onTestConnect
}: TokenGatesListProps) {
  return (
    <TableBody>
      {gates.length === 0 && (
        <TableRow>
          <TableCell align='center' colSpan={4} sx={{ padding: '20px 16px' }}>
            {isLoading ? <Loader size={20} /> : 'No token gates found'}
          </TableCell>
        </TableRow>
      )}
      {gates.map((tokenGate) => (
        <TokenGateTableRow
          key={tokenGate.id}
          isAdmin={isAdmin}
          spaceId={spaceId}
          account={account}
          tokenGate={tokenGate}
          refreshTokenGates={refreshTokenGates}
          testConnect={({ id }) => onTestConnect(id)}
        />
      ))}
    </TableBody>
  );
}

export default function TokenGatesTable({ isAdmin, isLoading, tokenGates, refreshTokenGates }: Props) {
  const { account } = useWeb3Account();
  const isMobile = useSmallScreen();
  const { space } = useCurrentSpace();
  const [tokenGateIdToTest, setTokenGateIdToTest] = useState<string | undefined>();

  const activeTokenGates = tokenGates.filter((gate) => !gate.archived);
  const archivedTokenGates = tokenGates.filter((gate) => gate.archived);

  return (
    <>
      <Box overflow='auto'>
        {/* Active Token Gates */}
        <Table size='small' aria-label='Active token gates table'>
          <TableHeader isMobile={isMobile} tokenGatesAvailable={tokenGates.length > 0} spaceDomain={space?.domain} />
          <TokenGatesList
            gates={activeTokenGates}
            isLoading={isLoading}
            isAdmin={isAdmin}
            spaceId={space?.id}
            account={account}
            refreshTokenGates={refreshTokenGates}
            onTestConnect={setTokenGateIdToTest}
          />
        </Table>

        {isAdmin && archivedTokenGates.length > 0 && (
          <>
            <Alert severity='info' sx={{ mb: 1, mt: 4 }}>
              After upgrading your subscription, you'll need to manually unarchive any token gates, roles, or workflows
              that you want to keep using.
            </Alert>
            <Table size='small' aria-label='Archived token gates table'>
              <TableHeader isMobile={isMobile} tokenGatesAvailable={false} isArchived />
              <TokenGatesList
                gates={archivedTokenGates}
                isLoading={isLoading}
                isAdmin={isAdmin}
                spaceId={space?.id}
                account={account}
                refreshTokenGates={refreshTokenGates}
                onTestConnect={setTokenGateIdToTest}
              />
            </Table>
          </>
        )}
      </Box>
      <TestConnectionModal
        open={!!tokenGateIdToTest}
        tokenGateId={tokenGateIdToTest}
        onClose={() => setTokenGateIdToTest(undefined)}
      />
    </>
  );
}
