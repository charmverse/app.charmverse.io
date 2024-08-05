import { Avatar } from '@connect-shared/components/common/Avatar';
import Box from '@mui/material/Box';

const height = '130px';

export function ProjectHeader({
  coverImage,
  avatar,
  name
}: {
  coverImage?: string | null;
  name: string;
  avatar?: string | null;
}) {
  return (
    <Box mb={4}>
      {coverImage ? (
        <img
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          src={coverImage}
          alt={name}
          width='100%'
          height={height}
        />
      ) : (
        <Box bgcolor='grey.300' width='100%' height={height} />
      )}
      <Avatar
        avatar={avatar ?? undefined}
        name={!avatar ? name : undefined}
        alt={name}
        size='xLarge'
        sx={{
          position: 'absolute',
          top: '80px',
          left: '24px'
        }}
        variant='rounded'
      />
    </Box>
  );
}
