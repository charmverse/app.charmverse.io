import type { ProjectData } from '@connect/lib/actions/fetchProject';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { FaXTwitter } from 'react-icons/fa6';

import { ProjectDescription } from '../components/ProjectDescription';
import { ShareButton } from '../ProjectShareButton';

export function ProjectDetails({ project }: { project: NonNullable<ProjectData> }) {
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
        {project.farcasterValues.length > 0 && (
          <Stack direction='row' gap={1} alignItems='center'>
            <img src='/images/farcaster.png' width={25} height={25} />
            <Link href={project.farcasterValues[0]} passHref target='_blank'>
              <Typography variant='body1'>
                {project.farcasterValues[0].replace(/https?:\/\/warpcast\.com\//, '')}
              </Typography>
            </Link>
          </Stack>
        )}
        {project.twitter && (
          <Stack direction='row' gap={1} alignItems='center'>
            <FaXTwitter
              style={{
                width: 24,
                height: 24
              }}
            />
            <Link href={project.twitter} passHref target='_blank'>
              <Typography variant='body1'>{project.twitter.replace(/https?:\/\/twitter\.com\//, '')}</Typography>
            </Link>
          </Stack>
        )}
        {project.github && (
          <Stack direction='row' gap={1} alignItems='center'>
            <GitHubIcon />
            <Link href={project.github} passHref target='_blank'>
              <Typography variant='body1'>{project.github.replace(/https?:\/\/github\.com\/?/, '')}</Typography>
            </Link>
          </Stack>
        )}
        {project.mirror && (
          <Stack direction='row' gap={1} alignItems='center'>
            <img src='/images/mirror-xyz.png' width={25} height={25} />
            <Link href={project.mirror} passHref target='_blank'>
              <Typography variant='body1'>{project.mirror.replace(/https?:\/\/mirror.xyz\//, '')}</Typography>
            </Link>
          </Stack>
        )}
      </Stack>
      {project.description && <ProjectDescription description={project.description} />}
    </Stack>
  );
}
