import LaunchIcon from '@mui/icons-material/Launch';
import { Alert, Button, Stack, Table, TableBody, TableCell, TableHead, Tooltip } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

import { Avatar } from 'components/common/Avatar';
import { GemsIcon } from 'components/common/Icons';
import type { NewScout } from 'lib/scouts/getNewScouts';

import { CommonTableRow } from './CommonTableRow';
import { TableCellText } from './TableCellText';

export function NewScoutsTable({ scouts }: { scouts: NewScout[] }) {
  return (
    <>
      <Alert
        sx={{ '.MuiAlert-action': { mx: 0 }, justifyContent: 'center' }}
        icon={<Image width={20} height={20} src='/images/crypto/op64.png' alt='' />}
        action={
          <Button
            href='/info/partner-rewards/optimism'
            target='_blank'
            color='inherit'
            size='small'
            endIcon={<LaunchIcon />}
            sx={{ fontSize: 'inherit', px: 2 }}
          >
            Learn more
          </Button>
        }
      >
        Join now and compete for 500 OP
      </Alert>
      <Table size='small' sx={{ px: { md: 10 }, backgroundColor: 'background.paper' }} data-test='new-scouts-table'>
        <TableHead sx={{ position: 'sticky', top: 45, zIndex: 1000, backgroundColor: 'background.paper' }}>
          <CommonTableRow>
            <TableCell align='center' sx={{ width: '20%' }}>
              RANK
            </TableCell>
            <TableCell align='left' sx={{ width: '20%' }}>
              SCOUT
            </TableCell>
            <TableCell align='right' sx={{ width: '20%' }}>
              <Tooltip title="Gems earned by the scout's builders">
                <Stack display='inline-flex' flexDirection='row' gap={0.5} alignItems='center'>
                  GEMS <GemsIcon />
                </Stack>
              </Tooltip>
            </TableCell>
            <TableCell align='center' sx={{ width: '20%' }}>
              SCOUTED
            </TableCell>
            <TableCell align='center' sx={{ width: '20%', display: { xs: 'none', md: 'table-cell' } }}>
              CARDS HELD
            </TableCell>
          </CommonTableRow>
        </TableHead>
        <TableBody>
          {scouts.map((scout, index) => (
            <CommonTableRow key={scout.path}>
              <TableCell align='center'>
                <TableCellText>
                  <Stack
                    alignItems='center'
                    flexDirection='row'
                    gap={1}
                    justifyContent='space-between'
                    width='45px'
                    mx='auto'
                  >
                    {index + 1}
                    {index < 10 ? <Image width={20} height={20} src='/images/crypto/op64.png' alt='' /> : <span />}
                  </Stack>
                </TableCellText>
              </TableCell>
              <TableCell>
                <Stack
                  component={Link}
                  href={`/u/${scout.path}?tab=scout`}
                  alignItems='center'
                  flexDirection='row'
                  gap={1}
                  maxWidth={{ xs: '100px', md: 'initial' }}
                >
                  <Avatar src={scout.avatar} name={scout.displayName} size='small' />
                  <TableCellText noWrap>{scout.displayName}</TableCellText>
                </Stack>
              </TableCell>
              <TableCell align='right'>
                <Stack alignItems='center' flexDirection='row' gap={1} justifyContent='flex-end'>
                  <TableCellText>{scout.builderGemsCollected || 0}</TableCellText>
                  <GemsIcon />
                </Stack>
              </TableCell>
              <TableCell align='center'>
                <TableCellText color='green.main'>{scout.buildersScouted || 0}</TableCellText>
              </TableCell>
              <TableCell align='center' sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                <TableCellText color='green.main'>{scout.nftsHeld || 0}</TableCellText>
              </TableCell>
            </CommonTableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}