import type { StackProps } from '@mui/material';
import { Button, Container, Stack, Typography } from '@mui/material';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import Image from 'next/image';
import Link from 'next/link';

function ContainerStack({ children, ...props }: { children: React.ReactNode } & StackProps) {
  return (
    <Stack
      {...props}
      sx={{
        p: {
          xs: 1,
          md: 4
        },
        my: {
          xs: 2,
          md: 3
        },
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
  return (
    <ContainerStack sx={{ flexDirection: additionalContent ? 'column' : 'row' }}>
      <Stack
        flexDirection='row'
        width='100%'
        alignItems={{
          xs: 'flex-start',
          md: 'center'
        }}
        gap={1}
      >
        <Stack
          gap={1}
          alignItems='center'
          width={{
            xs: '20%',
            md: '35%'
          }}
          position='relative'
          top={{
            xs: 3.5,
            md: 0
          }}
        >
          <Typography color='secondary'>{stepNumber}</Typography>
          <Hidden mdDown>
            <Image width={85} height={85} src={iconSrc} alt={stepNumber} />
          </Hidden>
          <Hidden mdUp>
            <Image width={50} height={50} src={iconSrc} alt={stepNumber} />
          </Hidden>
        </Stack>
        <Stack width={{ xs: '80%', md: '65%' }} gap={1}>
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
  return (
    <Stack sx={{ position: 'relative' }}>
      <Hidden mdDown>
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
      </Hidden>
      <Stack
        zIndex={{
          xs: 0,
          md: 1
        }}
        mx='auto'
        flexDirection={{
          xs: 'column',
          md: 'row'
        }}
        alignItems='center'
      >
        <Stack
          gap={2}
          my={{
            xs: 2,
            md: 4
          }}
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
          <Hidden mdUp>
            <Typography variant='h6' textAlign='center'>
              Pick great developers. Earn rewards.
              <br />
              Everyone can play. No coding required!
            </Typography>
          </Hidden>
          <Hidden mdDown>
            <Typography variant='h5' textAlign='left'>
              Pick great developers. Earn rewards.
              <br />
              Everyone can play. No coding required!
            </Typography>
          </Hidden>
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
            data-test='get-started-button'
          >
            <Link href='/login'>Get started</Link>
          </Button>
        </Stack>
        <Hidden mdDown>
          <Image src='/images/home/cool-dev.png' width={350} height={350} alt='Cool dev' />
        </Hidden>
        <Hidden mdUp>
          <Image src='/images/home/cool-dev.png' width={250} height={250} alt='Cool dev' />
        </Hidden>
      </Stack>
    </Stack>
  );
}

function HowToPlaySection() {
  return (
    <Stack position='relative'>
      <Stack
        zIndex={{
          xs: 0,
          md: 1
        }}
        alignItems='center'
        mt={3}
      >
        <Typography variant='h4' color='secondary' fontWeight={500}>
          How to Play
        </Typography>
        <Container
          maxWidth='lg'
          sx={{
            p: 0
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
                <Hidden mdDown>
                  <Image
                    src='/images/home/card-diagram.png'
                    width='350'
                    height='350'
                    alt='Collect cards'
                    style={{
                      height: '100%',
                      width: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </Hidden>
                <Hidden mdUp>
                  <Stack alignItems='center'>
                    <Image
                      src='/images/home/card-diagram-mobile.png'
                      width='350'
                      height='350'
                      alt='Collect cards'
                      style={{
                        height: '100%',
                        width: '75%',
                        objectFit: 'cover'
                      }}
                    />
                  </Stack>
                </Hidden>
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
  return (
    <Stack position='relative' alignItems='center' gap={2} py={{ xs: 0, md: 4 }} mb={{ xs: 4, md: 0 }}>
      <Hidden mdDown>
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
            top: 0,
            left: 0
          }}
        />
      </Hidden>
      <Stack
        mx='auto'
        zIndex={{
          xs: 0,
          md: 1
        }}
        justifyContent='center'
        alignItems='center'
        gap={2}
      >
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
  return (
    <Stack height='100%' overflow='hidden'>
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
      <Stack height='100%' overflow='auto' zIndex={1}>
        <HeroSection />
        <HowToPlaySection />
        <FooterSection />
      </Stack>
    </Stack>
  );
}
