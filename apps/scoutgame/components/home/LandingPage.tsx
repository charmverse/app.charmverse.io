import type { StackProps } from '@mui/material';
import { Button, Container, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

function ContainerStack({ children, ...props }: { children: React.ReactNode } & StackProps) {
  return (
    <Stack
      {...props}
      sx={{
        p: 3,
        my: 3,
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

export function LandingPage() {
  return (
    <Stack
      sx={{
        height: '100%',
        position: 'relative'
      }}
    >
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
      <Stack zIndex={1} mx='auto' flexDirection='row'>
        <Stack gap={2} my={4} mr={12} justifyContent='center'>
          <Typography variant='h3' color='secondary' fontWeight={500}>
            Fantasy Sports for <br /> Onchain Builders
          </Typography>
          <Typography variant='h5'>
            Pick great developers. Earn rewards.
            <br />
            Everyone can play. No coding required!
          </Typography>
          <Button
            variant='contained'
            sx={{
              my: 2,
              width: '50%'
            }}
          >
            <Link href='/login'>Get started</Link>
          </Button>
        </Stack>
        <Stack>
          <Image src='/images/home/cool-dev.png' width='350' height='350' alt='Cool dev' />
        </Stack>
      </Stack>
      <Stack position='relative'>
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
        <Stack zIndex={1} alignItems='center' mt={3}>
          <Typography variant='h4' color='secondary' fontWeight={500}>
            How to Play
          </Typography>
          <Container maxWidth='lg'>
            <ContainerStack>
              <Stack gap={1} alignItems='center' width='35%'>
                <Typography color='secondary'>Step 1</Typography>
                <Image width={85} height={85} src='/images/home/scout-icon.svg' alt='Step 1' />
              </Stack>
              <Stack width='65%' gap={1}>
                <Typography variant='h5' color='secondary'>
                  Discover Builders & Projects
                </Typography>
                <Typography>
                  Anyone can play Scout Game. Discover and back talented developers working on impactful open source
                  projects. Get to know the players who are moving the onchain ecosystem forward.
                </Typography>
              </Stack>
            </ContainerStack>

            <ContainerStack
              sx={{
                flexDirection: 'column'
              }}
            >
              <Stack flexDirection='row' width='100%'>
                <Stack gap={1} alignItems='center' width='35%'>
                  <Typography color='secondary'>Step 2</Typography>
                  <Image width={85} height={85} src='/images/home/card-icon.svg' alt='Step 1' />
                </Stack>
                <Stack width='65%' gap={1} justifyContent='center'>
                  <Typography variant='h5' color='secondary'>
                    Collect Builder Cards
                  </Typography>
                  <Typography>
                    Scout promising developers by collecting seasonal Builder NFT Cards. <br /> Earn Scout Points based
                    on their contributions and activity—your insights help highlight the best talent.
                  </Typography>
                </Stack>
              </Stack>
              <Typography variant='h6' color='secondary' mt={2} mb={1}>
                carl's Builder Card
              </Typography>
              <Image
                src='/images/home/card-diagram.png'
                width='350'
                height='350'
                alt='Collect cards'
                style={{
                  width: '100%',
                  objectFit: 'contain'
                }}
              />
            </ContainerStack>

            <ContainerStack>
              <Stack gap={1} alignItems='center' width='35%'>
                <Typography color='secondary'>Step 3</Typography>
                <Image width={85} height={85} src='/images/home/trophy-icon.svg' alt='Step 1' />
              </Stack>
              <Stack width='65%' gap={1}>
                <Typography variant='h5' color='secondary'>
                  Compete & Win
                </Typography>
                <Typography>
                  Compete with other Scouts in weekly challenges to climb the leaderboard and win. Scout talent, earn
                  rewards, and prove you’re the best in the game!
                </Typography>
              </Stack>
            </ContainerStack>

            <ContainerStack>
              <Stack gap={1} alignItems='center' width='35%'>
                <Typography color='secondary'>Step 4</Typography>
                <Image width={85} height={85} src='/images/home/quests-icon.svg' alt='Step 1' />
              </Stack>
              <Stack width='65%' gap={1}>
                <Typography variant='h5' color='secondary'>
                  Earn Rewards
                </Typography>
                <Typography>
                  Collect Scout Points weekly based on the success of your scouted Builders. Win additional prizes like
                  $Moxie or OP from our partners. Supporting innovation has never been so rewarding.
                </Typography>
              </Stack>
            </ContainerStack>
          </Container>
        </Stack>
      </Stack>
      <Stack position='relative' alignItems='center' gap={2} py={4}>
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
        <Stack mx='auto' zIndex={1} justifyContent='center' alignItems='center' gap={2}>
          <Typography variant='h6' textAlign='center'>
            Pick great developers. Earn rewards. <br /> Everyone can play. No coding required!
          </Typography>
          <Button variant='contained' sx={{ width: '50%' }}>
            <Link href='/login'>Get started</Link>
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
