import type { Project, ProjectMember } from '@charmverse/core/prisma-client';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { Avatar } from 'components/common/Avatar';

export function ProjectItem({
  project
}: {
  project: Project & { projectMembers: (ProjectMember & { user: { avatar: string | null } | null })[] };
}) {
  const projectMembers = project.projectMembers;

  return (
    <Card>
      <CardActionArea
        LinkComponent={Link}
        href={`/projects/${project.id}`}
        hrefLang='en'
        sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'flex-start', justifyContent: 'flex-start' }}
      >
        <CardMedia
          component='img'
          alt={project.name}
          src='https://cdn.charmverse.io/user-content/f50534c5-22e7-47ee-96cb-54f4ce1a0e3e/9b2b00af-9644-43aa-add1-cde22f0253c3/breaking_wave.jpg'
          sx={{ maxWidth: '100px', height: '100px', borderRadius: 3 }}
        />
        <CardContent
          component={Box}
          display='flex'
          justifyContent='space-between'
          flexDirection='column'
          alignItems='flex-start'
          gap={1}
          sx={{ p: 0 }}
        >
          <Box>
            <Typography>{project.name}</Typography>
            <Typography variant='body2'>{project.description}</Typography>
          </Box>
          <AvatarGroup max={6}>
            {projectMembers.map((member) => (
              <Avatar key={member.id} size='small' name={member.name} avatar={member.user?.avatar || ''} />
            ))}
          </AvatarGroup>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
