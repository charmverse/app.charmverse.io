import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box, Divider, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { DotsDivider } from './DotsDivider';
import { ScrollButton } from './ScrollButton';

export function LearnMore() {
  return (
    <Box>
      <ScrollButton scrollType='down' sx={{ textAlign: 'center', width: '100%', color: 'secondary.light' }}>
        scroll to learn more <ArrowDropDownIcon fontSize='small' />
      </ScrollButton>
      <Stack display='flex' mt={2} gap={2}>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            What is Scout Game?
          </Typography>
          <Typography>Here's your new mission: Become a Scout and hunt for the next big onchain builders.</Typography>
          <Typography>
            Your role? Spot them early and help them rise to the top. As they climb to success, you rake in rewards for
            backing the right talent.
          </Typography>
          <Typography>
            Forget gambling. This is about growth. Back real talent, watch them thrive, and share in the success.
          </Typography>
        </Box>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            How it works for Scouts
          </Typography>
          <Typography>Step into the shoes of an onchain Scout.</Typography>
          <Typography>1. Every season, collect top Builder’s NFTs</Typography>
          <Typography>2. Earn Charm Points as they crush open source repos and win grants</Typography>
        </Box>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            How it works for Builders
          </Typography>
          <Typography>Join the Scout Game as a Builder.</Typography>
          <Typography>
            The Scout Game runs in epic 3-month seasons, where you earn Charm Points by completing Qualified Actions! 🏆
          </Typography>
          <Typography>Here's how to rack up those points:</Typography>
          <Typography>1. Contribute to approved open source projects with an accepted Pull Request</Typography>
          <Typography>2. Make your mark with a first-time code contribution to an approved project</Typography>
          <Typography>3. Hit a 3-Pull Request streak within 7 day</Typography>
          <Typography>4. Be part of a team that wins grants from approved onchain organizations</Typography>
        </Box>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            The Waitlist
          </Typography>
          <Typography>Prepare for the launch of Scout Game in 5 stages.</Typography>
          <Typography>Only the most dedicated make it to the top, and Tier 1: Legendary goes first!</Typography>
          <Typography>
            Everyone starts in the Common tier. You can move up the Waitlist by earning points. Here is how:
          </Typography>
          <Typography>1. Sign up as a Builder and receive 1,000 points</Typography>
          <Typography>2. Share your Frame and every click will earn you 100 points.</Typography>
          <Typography>The higher you rise, the sooner you enter the game.</Typography>
          <Box
            sx={{
              '& > .MuiStack-root': {
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 1,
                '.MuiBox-root': { minWidth: '120px' },
                '.MuiTypography-root': { textWrap: 'nowrap' },
                img: { width: 'auto', height: '24px' }
              }
            }}
          >
            <Stack>
              <Typography fontWeight='700'>Percentile</Typography>
              <Box>
                <Typography fontWeight='700'>Tier</Typography>
              </Box>
            </Stack>
            <Stack>
              <Typography>95% to 100%</Typography>
              <DotsDivider />
              <Box>
                <Image src='/images/levels/legendary.png' sizes='100vw' width={100} height={18} alt='legendary' />
              </Box>
            </Stack>
            <Stack>
              <Typography>80% to 94%</Typography>
              <DotsDivider />
              <Box>
                <Image src='/images/levels/mythic.png' width={100} height={18} alt='mythic' sizes='100vw' />
              </Box>
            </Stack>
            <Stack>
              <Typography>60% to 79%</Typography>
              <DotsDivider />
              <Box>
                <Image src='/images/levels/epic.png' width={100} height={18} alt='epirary' sizes='100vw' />
              </Box>
            </Stack>
            <Stack>
              <Typography>30% to 59%</Typography>
              <DotsDivider />
              <Box>
                <Image src='/images/levels/rare.png' width={100} height={18} alt='rare' sizes='100vw' />
              </Box>
            </Stack>
            <Stack>
              <Typography>{'<'} 30%</Typography>
              <DotsDivider />
              <Box>
                <Image src='/images/levels/common.png' width={100} height={18} alt='common' sizes='100vw' />
              </Box>
            </Stack>
          </Box>
          <Typography>Each tier grants you free credits to play the Scout Game.</Typography>
          <Box
            sx={{
              '& > .MuiStack-root': {
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 2
              },
              img: { width: 'auto', height: '24px' }
            }}
          >
            <Stack>
              <Typography fontWeight='700'>Tier</Typography>
              <Typography fontWeight='700'>Scout Credits</Typography>
            </Stack>
            <Stack>
              <Image src='/images/levels/legendary.png' sizes='100vw' width={100} height={18} alt='legendary' />
              <DotsDivider />
              <Typography>50</Typography>
            </Stack>
            <Stack>
              <Image src='/images/levels/mythic.png' sizes='100vw' width={100} height={18} alt='mythic' />
              <DotsDivider />
              <Typography>20</Typography>
            </Stack>
            <Stack>
              <Image src='/images/levels/epic.png' sizes='100vw' width={100} height={18} alt='epic' />
              <DotsDivider />
              <Typography>10</Typography>
            </Stack>
            <Stack>
              <Image src='/images/levels/rare.png' sizes='100vw' width={100} height={18} alt='rare' />
              <DotsDivider />
              <Typography>5</Typography>
            </Stack>
            <Stack>
              <Image src='/images/levels/common.png' sizes='100vw' width={100} height={18} alt='common' />
              <DotsDivider />
              <Typography>1</Typography>
            </Stack>
          </Box>
        </Box>
      </Stack>
      <ScrollButton scrollType='up' sx={{ textAlign: 'center', width: '100%' }}>
        back to top <ArrowDropUpIcon fontSize='small' />
      </ScrollButton>
    </Box>
  );
}
