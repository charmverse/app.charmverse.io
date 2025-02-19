import Box from '@mui/material/Box';
import { Avatar } from '@packages/connect-shared/components/common/Avatar';

const height = '130px';

// const projectHeaderImage = '/images/project-header.jpg';

export function ProjectHeader({
  coverImage,
  avatar,
  name
}: {
  coverImage?: string | null;
  name: string;
  avatar?: string | null;
}) {
  // coverImage ||= projectHeaderImage;
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
        <Box bgcolor='grey.800' width='100%' height={height} />
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
