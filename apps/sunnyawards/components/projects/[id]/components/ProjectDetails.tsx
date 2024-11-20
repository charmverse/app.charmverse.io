import type { ConnectProjectDetails } from '@connect-shared/lib/projects/findProject';
import EditIcon from '@mui/icons-material/Edit';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { replaceUrl } from '@root/lib/utils/url';
import Link from 'next/link';
import { FaXTwitter } from 'react-icons/fa6';

import { ProjectDescription } from './ProjectDescription';
import { ShareButton } from './ProjectShareButton';

export type ProjectDetailsProps = {
  project: Pick<
    ConnectProjectDetails,
    'farcasterValues' | 'github' | 'twitter' | 'name' | 'websites' | 'description' | 'id' | 'path'
  >;
  showEditButton?: boolean;
};

export function ProjectDetails({ project, showEditButton = false }: ProjectDetailsProps) {
  const farcasterLink = project?.farcasterValues[0] ? replaceUrl(project.farcasterValues[0], 'warpcast.com') : null;
  const githubLink = project?.github ? replaceUrl(project.github, 'github.com') : null;
  const twitterLink = project?.twitter ? replaceUrl(project.twitter, 'x.com') : null;

  return (
    <Box data-test='project-details'>
      <Stack direction='row' mb={2} justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={1}>
        <Typography variant='h5' data-test='project-name'>
          {project.name}
        </Typography>
        <Stack direction='row' gap={1} alignItems='center'>
          {showEditButton && project.path && (
            <Link href={`/p/${project.path}/edit`}>
              <IconButton size='small' color='secondary'>
                <EditIcon fontSize='small' />
              </IconButton>
            </Link>
          )}
          <ShareButton projectId={project.id} data-test='share-button' />
        </Stack>
      </Stack>
      <Stack gap={1.5} flexDirection='row' color='text.primary'>
        {farcasterLink && (
          <Link href={farcasterLink.href} passHref target='_blank' data-test='project-farcaster'>
            <img src='/images/farcaster.png' width={25} height={25} />
          </Link>
        )}
        {project.websites[0] && (
          <Link href={project.websites[0]} passHref target='_blank' data-test='project-website'>
            <LanguageIcon />
          </Link>
        )}
        {twitterLink && (
          <Link href={twitterLink.href} passHref target='_blank' data-test='project-twitter'>
            <FaXTwitter
              style={{
                width: 24,
                height: 24
              }}
            />
          </Link>
        )}
        {githubLink && (
          <Link href={githubLink.href} passHref target='_blank' data-test='project-github'>
            <GitHubIcon />
          </Link>
        )}
      </Stack>
      {project.description && <ProjectDescription description={project.description} />}
    </Box>
  );
}
