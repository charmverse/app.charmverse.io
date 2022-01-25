
import Avatar from '@mui/material/Avatar';
import { stringToColor } from 'lib/strings';

export default function ({ name = '' }: { name: string }) {
  return (
    <Avatar sx={{ bgcolor: stringToColor(name) }}>
      {name.charAt(0).toUpperCase()}
    </Avatar>
  );
}
