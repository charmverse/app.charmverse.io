import { prisma, Project } from '@charmverse/core/prisma-client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Avatar } from 'components/common/Avatar';

export async function ProjectsList() {
  const projectsList = await prisma.project.findMany({
    where: {
      deletedAt: null
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5,
    include: {
      user: {
        select: {
          avatar: true,
          username: true
        }
      }
    }
  });

  if (projectsList.length === 0) {
    return <Typography mt={1}>There are no new projects</Typography>;
  }

  return projectsList.map((project) => {
    const username = project.user.username || '';
    const avatar = project.user.avatar || '';

    return (
      <Box
        key={project.id}
        borderRadius={3}
        p={2}
        border={1}
        borderColor='divider'
        display='flex'
        flexDirection='row'
        gap={2}
      >
        <Box>
          <Avatar size='xLarge' variant='rounded' name={username} avatar={avatar} />
        </Box>
        <Box display='flex' justifyContent='space-between' flexDirection='column'>
          <Box>
            <Typography>{project.name}</Typography>
            <Typography variant='body2'>{project.description}</Typography>
          </Box>
          <Box display='flex' flexDirection='row'>
            <Avatar size='small' name={username || ''} avatar={avatar} />
            <Typography variant='body2'></Typography>
          </Box>
        </Box>
      </Box>
    );
  });
}
