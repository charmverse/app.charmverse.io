import type { ConnectProjectDetails } from '@connect/lib/projects/fetchProject';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { FaXTwitter } from 'react-icons/fa6';

import { replaceUrl } from 'lib/utils/url';

import { ProjectDescription } from '../components/ProjectDescription';
import { ShareButton } from '../ProjectShareButton';

export type ProjectDetailsProps = {
  project: Pick<
    ConnectProjectDetails,
    'farcasterValues' | 'github' | 'mirror' | 'twitter' | 'name' | 'websites' | 'description' | 'id'
  >;
};

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const farcasterLink = project?.farcasterValues[0] ? replaceUrl(project.farcasterValues[0], 'warpcast.com') : null;
  const githubLink = project?.github ? replaceUrl(project.github, 'github.com') : null;
  const mirrorLink = project?.mirror ? replaceUrl(project.mirror, 'mirror.xyz') : null;
  const twitterLink = project?.twitter ? replaceUrl(project.twitter, 'twitter.com') : null;

  return (
    <Stack>
      <Stack direction='row' mb={2} justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={0.5}>
        <Typography variant='h5'>{project.name}</Typography>
        <ShareButton projectId={project.id} />
      </Stack>
      <Stack gap={1.5}>
        {project.websites[0] && (
          <Stack direction='row' gap={1} alignItems='center'>
            <LanguageIcon color='secondary' />
            <Link href={project.websites[0]} passHref target='_blank'>
              <Typography variant='body1'>{project.websites[0].replace(/https?:\/\//, '')}</Typography>
            </Link>
          </Stack>
        )}
        {farcasterLink && (
          <Stack direction='row' gap={1} alignItems='center'>
            <img src='/images/farcaster.png' width={25} height={25} />
            <Link href={farcasterLink.href} passHref target='_blank'>
              <Typography variant='body1'>{farcasterLink.text}</Typography>
            </Link>
          </Stack>
        )}
        {twitterLink && (
          <Stack direction='row' gap={1} alignItems='center'>
            <FaXTwitter
              style={{
                width: 24,
                height: 24
              }}
            />
            <Link href={twitterLink.href} passHref target='_blank'>
              <Typography variant='body1'>{twitterLink.text}</Typography>
            </Link>
          </Stack>
        )}
        {githubLink && (
          <Stack direction='row' gap={1} alignItems='center'>
            <GitHubIcon />
            <Link href={githubLink.href} passHref target='_blank'>
              <Typography variant='body1'>{githubLink.text}</Typography>
            </Link>
          </Stack>
        )}
        {mirrorLink && (
          <Stack direction='row' gap={1} alignItems='center'>
            <img src='/images/mirror-xyz.png' width={25} height={25} />
            <Link href={mirrorLink.href} passHref target='_blank'>
              <Typography variant='body1'>{mirrorLink.text}</Typography>
            </Link>
          </Stack>
        )}
      </Stack>
      {project.description && <ProjectDescription description={project.description} />}
    </Stack>
  );
}
