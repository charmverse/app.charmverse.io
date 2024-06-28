import { fetchProject } from '@connect/lib/actions/fetchProject';
import { Person } from '@mui/icons-material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';
import { Box, Divider, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { FaXTwitter } from 'react-icons/fa6';

import { Avatar } from '../../common/Avatar';
import { FarcasterCard } from '../../common/FarcasterCard';
import { PageWrapper } from '../../common/PageWrapper';
import { ProjectDescription } from '../components/ProjectDescription';
import { ShareButton } from '../ProjectShareButton';

export async function ProjectDetailsPage({ projectId }: { projectId: string }) {
  const project = await fetchProject(projectId);

  return (
    <PageWrapper
      sx={{
        position: 'relative',
        p: 0
      }}
    >
      <Box
        sx={{
          top: 0,
          p: 2,
          width: '499px',
          borderRight: {
            xs: 'none',
            md: '1px solid var(--charm-palette-divider)'
          },
          backgroundColor: 'white',
          zIndex: 1,
          position: 'fixed'
        }}
      >
        <Stack sx={{ cursor: 'pointer', flexDirection: 'row', gap: 0.5, alignItems: 'center', width: 'fit-content' }}>
          <Person fontSize='small' />
          <Link href='/profile' passHref>
            <Typography>Back to profile</Typography>
          </Link>
        </Stack>
      </Box>
      {!project ? (
        <Typography mt={5} p={2} variant='h6'>
          Project not found
        </Typography>
      ) : (
        <>
          <img
            src={
              project.coverImage ||
              'https://cdn.charmverse.io/user-content/f50534c5-22e7-47ee-96cb-54f4ce1a0e3e/9b2b00af-9644-43aa-add1-cde22f0253c3/breaking_wave.jpg'
            }
            alt={project.name}
            width='100%'
            height='150px'
            style={{
              marginTop: 8,
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
          <Avatar
            avatar={project.avatar ?? undefined}
            name={!project.avatar ? project.name : undefined}
            alt={project.name}
            size='xLarge'
            sx={{
              position: 'absolute',
              top: '100px',
              marginLeft: '24px'
            }}
            variant='rounded'
          />
          <Stack p={3} mt={4}>
            <Stack direction='row' mb={2} justifyContent='space-between' alignItems='center'>
              <Typography variant='h5'>{project.name}</Typography>
              <ShareButton />
            </Stack>
            <Stack gap={1.5}>
              {project.github && (
                <Stack direction='row' gap={1} alignItems='center'>
                  <GitHubIcon />
                  <Link href={project.github} passHref target='_blank'>
                    <Typography variant='body1'>{project.github.replace(/https?:\/\/github\.com\/?/, '')}</Typography>
                  </Link>
                </Stack>
              )}
              {project.websites.length > 0 && (
                <Stack direction='row' gap={1} alignItems='center'>
                  <LanguageIcon color='secondary' />
                  <Link href={project.websites[0]} passHref target='_blank'>
                    <Typography variant='body1'>{project.websites[0].replace(/https?:\/\//, '')}</Typography>
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
            </Stack>
            {project.description && <ProjectDescription description={project.description} />}
            <Divider sx={{ my: 2 }} />
            <Typography variant='h6'>Members</Typography>
            <Stack gap={1}>
              {project.projectMembers.map((member) => (
                <FarcasterCard
                  fid={member.farcasterUser.fid}
                  key={member.farcasterUser.fid}
                  name={member.farcasterUser.displayName}
                  username={member.farcasterUser.username}
                  avatar={member.farcasterUser.pfpUrl}
                  bio={member.farcasterUser.bio}
                />
              ))}
            </Stack>
          </Stack>
        </>
      )}
    </PageWrapper>
  );
}
