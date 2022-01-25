import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';
import Legend from 'components/settings/Legend';
import Button from 'components/common/Button';
import Typography from '@mui/material/Typography';
import MemberRow, { Member } from 'components/settings/MemberRow';

const members: Member[] = [
  { address: '0x1416d1b5435D12CE393aBbA3f81fe6C5951e4Bf4', username: 'cerberus', role: 'admin' },
  { address: '0x626a827c90AA620CFD78A8ecda494Edb9a4225D5', username: 'devorein', role: 'editor' },
  { address: '0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2', username: 'mattopoly', role: 'editor' }
]

export default function MembersSettings () {

  return (<>
    <Legend>
      Invite Links
      <Button size='small' variant='outlined' sx={{ float: 'right'}}>Add a link</Button>
    </Legend>
    <Typography color='secondary'>No invite links yet</Typography>

    <Legend>
      Token Gates
      <Button size='small' variant='outlined' sx={{ float: 'right'}}>Add a gate</Button>
    </Legend>
    <Typography color='secondary'>No token gates yet</Typography>

    <Legend>Current Members</Legend>
    {members.map((member) => (
      <MemberRow member={member} />
    ))}
  </>);
}

MembersSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};