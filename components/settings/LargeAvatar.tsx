
import styled from '@emotion/styled';
import Avatar from '@mui/material/Avatar';

const StyledAvatar = styled(Avatar)`
  font-size: 75px;
  width: 150px;
  height: 150px;
`;

export default function ({ name = '' }: { name: string }) {

  return <StyledAvatar sx={{ bgcolor: stringToColor(name) }}>{name.charAt(0).toUpperCase()}</StyledAvatar>;
}

// generate a color based on a string. Copied from https://mui.com/components/avatars/
function stringToColor (name: string) {
  let hash = 0;
  let i;

  for (i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.substr(-2);
  }

  return color;
}