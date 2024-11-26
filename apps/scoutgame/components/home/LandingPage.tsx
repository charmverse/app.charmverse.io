'use client';

import type { StackProps } from '@mui/material';
import { Button, Container, Stack, Typography } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Image from 'next/image';
import Link from 'next/link';

function ContainerStack({ children, ...props }: { children: React.ReactNode } & StackProps) {
  const isDesktop = useMdScreen();

  return (
    <Stack
      {...props}
      sx={{
        p: isDesktop ? 4 : 1,
        my: isDesktop ? 3 : 2,
        width: '100%',
        bgcolor: 'background.dark',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 1.5,
        ...props.sx
      }}
    >
      {children}
    </Stack>
  );
}

function Step({
  stepNumber,
  title,
  description,
  iconSrc,
  additionalContent
}: {
  stepNumber: string;
  title: string;
  description: string | React.ReactNode;
  iconSrc: string;
  additionalContent?: React.ReactNode;
}) {
  const isDesktop = useMdScreen();
  return (
    <ContainerStack sx={{ flexDirection: additionalContent ? 'column' : 'row' }}>
      <Stack flexDirection='row' width='100%' alignItems={isDesktop ? 'center' : 'flex-start'} gap={1}>
        <Stack
          gap={1}
          alignItems='center'
          width={isDesktop ? '35%' : '20%'}
          position='relative'
          top={isDesktop ? 0 : 3.5}
        >
          <Typography color='secondary'>{stepNumber}</Typography>
          <Image width={isDesktop ? 85 : 50} height={isDesktop ? 85 : 50} src={iconSrc} alt={stepNumber} />
        </Stack>
        <Stack width={isDesktop ? '65%' : '80%'} gap={1}>
          <Typography variant='h5' color='secondary'>
            {title}
          </Typography>
          <Typography>{description}</Typography>
        </Stack>
      </Stack>
      {additionalContent}
    </ContainerStack>
  );
}

function HeroSection() {
  const isDesktop = useMdScreen();

  return (
    <Stack sx={{ position: 'relative' }}>
      {isDesktop ? (
        <Image
          src='/images/home/landing-bg.png'
          width='500'
          height='350'
          alt='title icon'
          style={{
            width: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0
          }}
        />
      ) : null}
      <Stack
        zIndex={1}
        mx='auto'
        flexDirection={{
          xs: 'column',
          md: 'row'
        }}
        alignItems='center'
      >
        <Stack
          gap={2}
          my={isDesktop ? 4 : 2}
          mr={{
            xs: 0,
            md: 12
          }}
          justifyContent='center'
        >
          <Typography
            variant='h3'
            color='secondary'
            fontWeight={500}
            textAlign={{
              xs: 'center',
              md: 'left'
            }}
          >
            Fantasy Sports for <br /> Onchain Builders
          </Typography>
          <Typography
            variant={isDesktop ? 'h5' : 'h6'}
            textAlign={{
              xs: 'center',
              md: 'left'
            }}
          >
            Pick great developers. Earn rewards.
            <br />
            Everyone can play. No coding required!
          </Typography>
          <Button
            variant='contained'
            sx={{
              my: 2,
              width: '50%',
              mx: {
                xs: 'auto',
                md: 0
              }
            }}
          >
            <Link href='/login'>Get started</Link>
          </Button>
        </Stack>
        <Image
          src='/images/home/cool-dev.png'
          width={isDesktop ? 350 : 250}
          height={isDesktop ? 350 : 250}
          alt='Cool dev'
        />
      </Stack>
    </Stack>
  );
}

function HowToPlaySection() {
  const isDesktop = useMdScreen();
  return (
    <Stack position='relative'>
      {isDesktop ? (
        <Image
          src='/images/home/starry-bg.png'
          width='500'
          height='350'
          alt='title icon'
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0
          }}
        />
      ) : null}
      <Stack zIndex={1} alignItems='center' mt={3}>
        <Typography variant='h4' color='secondary' fontWeight={500}>
          How to Play
        </Typography>
        <Container
          maxWidth='lg'
          sx={{
            p: isDesktop ? 2 : 0
          }}
        >
          <Step
            stepNumber='Step 1'
            title='Discover Builders & Projects'
            description='Anyone can play Scout Game. Discover and back talented developers working on impactful open source projects. Get to know the players who are moving the onchain ecosystem forward.'
            iconSrc='/images/home/scout-icon.svg'
          />
          <Step
            stepNumber='Step 2'
            title='Collect Builder Cards'
            description='Scout promising developers by collecting seasonal Builder NFT Cards. Earn Scout Points based on their contributions and activity—your insights help highlight the best talent.'
            iconSrc='/images/home/card-icon.svg'
            additionalContent={
              <Stack alignItems='center'>
                <Typography variant='h6' color='secondary' mt={2} mb={1} textAlign='center'>
                  carl's Builder Card
                </Typography>
                <Image
                  src={isDesktop ? '/images/home/card-diagram.png' : '/images/home/card-diagram-mobile.png'}
                  width='350'
                  height='350'
                  alt='Collect cards'
                  style={{
                    height: '100%',
                    width: isDesktop ? '100%' : '75%',
                    objectFit: isDesktop ? 'contain' : 'cover'
                  }}
                />
              </Stack>
            }
          />
          <Step
            stepNumber='Step 3'
            title='Compete & Win'
            description='Compete with other Scouts in weekly challenges to climb the leaderboard and win. Scout talent, earn rewards, and prove you’re the best in the game!'
            iconSrc='/images/home/trophy-icon.svg'
          />
          <Step
            stepNumber='Step 4'
            title='Earn Rewards'
            description='Collect Scout Points weekly based on the success of your scouted Builders. Win additional prizes like $Moxie or OP from our partners. Supporting innovation has never been so rewarding.'
            iconSrc='/images/home/quests-icon.svg'
          />
        </Container>
      </Stack>
    </Stack>
  );
}

function FooterSection() {
  const isDesktop = useMdScreen();
  return (
    <Stack position='relative' alignItems='center' gap={2} py={isDesktop ? 4 : 0} pb={isDesktop ? 0 : 3}>
      {isDesktop ? (
        <Image
          src='/images/home/landing-bg.png'
          width='500'
          height='250'
          alt='footer bg'
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0
          }}
        />
      ) : null}
      <Stack mx='auto' zIndex={1} justifyContent='center' alignItems='center' gap={2}>
        <Typography variant='h6' textAlign='center'>
          Pick great developers. Earn rewards. <br /> Everyone can play. No coding required!
        </Typography>
        <Button variant='contained' sx={{ width: '50%' }}>
          <Link href='/login'>Get started</Link>
        </Button>
      </Stack>
    </Stack>
  );
}

export function LandingPage() {
  const isDesktop = useMdScreen();
  return (
    <Stack>
      {!isDesktop ? (
        <Image
          src='/images/home/starry-bg.png'
          width='500'
          height='350'
          alt='title icon'
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0
          }}
        />
      ) : null}
      <HeroSection />
      <HowToPlaySection />
      <FooterSection />
    </Stack>
  );
}
