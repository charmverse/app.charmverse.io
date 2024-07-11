import type { ConnectProjectDetails } from '@connect/lib/projects/fetchProject';
import EditIcon from '@mui/icons-material/Edit';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { IconButton, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { FaXTwitter } from 'react-icons/fa6';

import { replaceUrl } from 'lib/utils/url';

import { ProjectDescription } from '../components/ProjectDescription';

import { ShareButton } from './ProjectShareButton';

export type ProjectDetailsProps = {
  project: Pick<
    ConnectProjectDetails,
    'farcasterValues' | 'github' | 'mirror' | 'twitter' | 'name' | 'websites' | 'description' | 'id' | 'path'
  >;
  showEditButton?: boolean;
};

export function ProjectDetails({ project, showEditButton = false }: ProjectDetailsProps) {
  const farcasterLink = project?.farcasterValues[0] ? replaceUrl(project.farcasterValues[0], 'warpcast.com') : null;
  const githubLink = project?.github ? replaceUrl(project.github, 'github.com') : null;
  const mirrorLink = project?.mirror ? replaceUrl(project.mirror, 'mirror.xyz') : null;
  const twitterLink = project?.twitter ? replaceUrl(project.twitter, 'twitter.com') : null;

  return (
    <Stack data-test='project-details'>
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
      <Stack gap={1.5}>
        {project.websites[0] && (
          <Stack direction='row' gap={1} alignItems='center' data-test='project-website'>
            <LanguageIcon color='secondary' />
            <Link href={project.websites[0]} passHref target='_blank'>
              <Typography data-test='project-details-website' variant='body1'>
                {project.websites[0].replace(/https?:\/\//, '')}
              </Typography>
            </Link>
          </Stack>
        )}
        {farcasterLink && (
          <Stack direction='row' gap={1} alignItems='center' data-test='project-farcaster'>
            <img src='/images/farcaster.png' width={25} height={25} />
            <Link href={farcasterLink.href} passHref target='_blank'>
              <Typography variant='body1' data-test='project-details-farcaster'>
                {farcasterLink.text}
              </Typography>
            </Link>
          </Stack>
        )}
        {twitterLink && (
          <Stack direction='row' gap={1} alignItems='center' data-test='project-twitter'>
            <FaXTwitter
              style={{
                width: 24,
                height: 24
              }}
            />
            <Link href={twitterLink.href} passHref target='_blank'>
              <Typography variant='body1' data-test='project-details-twitter'>
                {twitterLink.text}
              </Typography>
            </Link>
          </Stack>
        )}
        {githubLink && (
          <Stack direction='row' gap={1} alignItems='center' data-test='project-github'>
            <GitHubIcon />
            <Link href={githubLink.href} passHref target='_blank'>
              <Typography variant='body1' data-test='project-details-github'>
                {githubLink.text}
              </Typography>
            </Link>
          </Stack>
        )}
        {mirrorLink && (
          <Stack direction='row' gap={1} alignItems='center' data-test='project-mirror'>
            <img src='/images/mirror-xyz.png' width={25} height={25} />
            <Link href={mirrorLink.href} passHref target='_blank'>
              <Typography variant='body1' data-test='project-details-mirror'>
                {mirrorLink.text}
              </Typography>
            </Link>
          </Stack>
        )}
      </Stack>
      {project.description && <ProjectDescription description={project.description} />}
    </Stack>
  );
}
