import { Avatar } from '@connect/components/common/Avatar';
import type { ProjectsWithMembers } from '@connect/lib/projects/getRecentProjectsWithMembers';
import type { StatusAPIResponse } from '@farcaster/auth-kit';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

export function ProjectItem({ project }: { project: ProjectsWithMembers[0] }) {
  const projectMembers = project.projectMembers;
  const projectName = project.name || 'Untitled';

  return (
    <Card>
      <CardActionArea
        LinkComponent={Link}
        href={`/p/${project.path}`}
        hrefLang='en'
        sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'normal', justifyContent: 'flex-start' }}
      >
        {project.avatar ? (
          <CardMedia
            component='img'
            alt={projectName}
            src={project.avatar}
            sx={{ maxWidth: '100px', minWidth: '100px', height: '100px', borderRadius: 3 }}
          />
        ) : (
          <Avatar avatar={undefined} name={projectName} alt={projectName} size='xLarge' variant='rounded' />
        )}
        <CardContent
          component={Box}
          display='flex'
          justifyContent='space-between'
          flexDirection='column'
          alignItems='start'
          gap={0.5}
          sx={{ p: 0 }}
        >
          <Box>
            <Typography
              variant='h6'
              overflow='hidden'
              sx={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: '1'
              }}
            >
              {projectName}
            </Typography>
            <Typography
              variant='body2'
              overflow='hidden'
              sx={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: '2'
              }}
            >
              {project.description}
            </Typography>
          </Box>
          <AvatarGroup max={6}>
            {projectMembers.map((member) => (
              <Avatar
                key={member.id}
                size='small'
                name={member.name || 'Untitled'}
                avatar={(member.user?.farcasterUser?.account as unknown as StatusAPIResponse)?.pfpUrl || ''}
              />
            ))}
          </AvatarGroup>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
