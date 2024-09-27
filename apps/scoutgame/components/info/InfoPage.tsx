import 'server-only';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box, List, ListItem, Typography, Divider, Stack } from '@mui/material';
import Image from 'next/image';

import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';

import { DotsDivider } from './components/DotsDivider';
import { ScrollButton } from './components/ScrollButton';

export function InfoPage() {
  return (
    <div>
      <Box mt={8} mb={12} gap={2} display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
        <Image
          src='/images/scout-game-logo-square.png'
          width={400}
          height={200}
          sizes='100vw'
          style={{
            width: '100%',
            maxWidth: '200px',
            height: 'auto'
          }}
          alt='ScoutGame'
        />
        <Typography variant='h5' fontWeight='700' align='center'>
          Scout. Build. Win.
        </Typography>
      </Box>
      <Box>
        <LearnMore />
      </Box>
    </div>
  );
}

function LearnMore() {
  return (
    <Box>
      <Stack display='flex' mt={2} gap={2}>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            TL;DR
          </Typography>
          <Typography>
            Think fantasy sports for open-source development. Collect developer NFTs, earn points when they merge Pull
            Requests in approved repositories, and win rewards. Some projects even offer additional crypto incentives.
          </Typography>
          <List sx={{ listStyleType: 'disc', ml: 2 }}>
            <ListItem sx={{ display: 'list-item' }}>
              Anyone can scout a builder by buying NFTs representing that builder
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              A builder can claim Scout Gems and Attestations after performing Qualified Actions like a merged pull
              request in a Qualified GitHub Repository
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              At the end of each week, Builders are ranked by the number of Gems they collect. Scout Points are
              allocated to the top-ranking Builders and the Scouts who hold their NFTs
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              Scouts and Builders can claim Scout Points at the end of each week
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              Scout Points are only claimable for the last and current seasons (3 months each)
            </ListItem>
          </List>
        </Box>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            What is the Scout Game?
          </Typography>
          <Typography>
            Here's your new mission: Become a Scout and hunt for the next big onchain builders. Your role? Spot them
            early and help them rise to the top. As they climb to success, you rake in rewards for backing the right
            talent.
          </Typography>
          <Typography>
            Forget gambling. This is about growth. Back real talent, watch them thrive, and share in the success
          </Typography>
          <Typography>
            The Scout Game is designed to reward individuals for identifying and supporting emerging developer talent
            within onchain ecosystems. As a Scout, your goal is to recognize promising builders early in their journey
            and help them gain visibility. In return, you earn rewards based on their success.
          </Typography>
        </Box>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            How it works for Scouts
          </Typography>
          <Typography>Step into the shoes of an onchain Scout.</Typography>
          <Typography>
            Scouts participate by collecting NFTs associated with top builders during each season. As these builders
            excel—by contributing to codebases—Scouts accumulate points. The more successful your chosen builders, the
            more points you earn.
          </Typography>
          <Typography>
            By accumulating Scout Points, you can exchange them to scout even more builders, boosting your standing
            within the game and increasing your potential rewards.
          </Typography>
          <Typography fontWeight='bold'>Key Scout Actions:</Typography>
          <Typography>• Collect NFTs from top builders every season.</Typography>
          <Typography>• Earn Scout Points when the builders you back succeed in open-source contributions.</Typography>
        </Box>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            How it works for Builders
          </Typography>
          <Typography>Join the Scout Game as a Builder and connect your GitHub account.</Typography>
          <Typography>
            Builders in the Scout Game gain recognition by actively contributing to approved projects. Each season lasts
            three months, and builders earn Scout Points by completing specific tasks tied to their contributions.
          </Typography>
          <Typography fontWeight='bold'>Key Builder Actions:</Typography>
          <Typography>• Contribute to approved open source projects with an accepted Pull Request</Typography>
          <Typography>• Make your mark with a first-time code contribution to an approved project</Typography>
          <Typography>• Hit a 3-Pull Request streak within 7 days</Typography>
        </Box>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            What are Scout Points and how do I earn them?
          </Typography>
          <Typography>Scout Points are Scout Game currency.</Typography>
          <Typography>1 Scout Point = $0.10</Typography>
          <Typography>
            Scout Points are claimable each week and remain claimable for only the current season and the next season.
          </Typography>
        </Box>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            Weekly Builder Ranking & Reward Allocation
          </Typography>
          <Typography>
            Scout Game runs in seasons. Each season is 13 weeks. During each week, Builders collect Scout Gems by
            completing qualified actions.
          </Typography>
          <Typography>• Accepted PR in an approved repo = 1 Gem</Typography>
          <Typography>• First PR in an approved repo = 10 Gems</Typography>
          <Typography>• Third PR in an approved repo within 7 days = 3 Gems</Typography>
          <Typography>• A Builder may only score Gems for one PR per approved repo per day.</Typography>
          <Typography>• Gem rewards do not stack. The maximum score for a single PR is 10 Gems.</Typography>
          <Typography>
            At the end of each week, Builders are ranked by the number of Gems they collected that week. Scout Points
            are allocated to the top-ranking Builders and the Scouts who hold their NFTs according to this formula:
          </Typography>
          <Typography>RewardR = A X [(1 - D)^(R-1) - (1 - D)^R]</Typography>
          <Typography>Where</Typography>
          <Typography>A = Total Scout Point Allocation for the Week</Typography>
          <Typography>R = Rank</Typography>
          <Typography>D = Decay Rate = 3%</Typography>
          <Typography>The reward is split between the Builder and their scouts as follows:</Typography>
          <Typography>BuilderR Reward = 20% x RewardR</Typography>
          <Typography>ScoutR Reward = 80% x (H / S) x RewardR</Typography>
          <Typography>Where</Typography>
          <Typography>R = Builder's rank that week</Typography>
          <Typography>H = Number of the Builder's NFTs owned by the Scout</Typography>
          <Typography>S = Total number of the Builder's NFTs minted</Typography>
          <Typography>A Builder's Gem count resets to zero at the start of each week.</Typography>
        </Box>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            Builder NFTs
          </Typography>
          <Typography>
            Builder NFTs can be purchased with Eth, USDC, or USDT on Base, OP or Arb. Scout Points can also be used to
            purchase Builder NFTs at 50% discount. Builders receive 20% of the proceeds from their NFT sales in Scout
            Points.
          </Typography>
          <Typography>
            The price of a Builder's first NFT mint is $2.00. The price of the next NFT of the same Builder is
            calculated as follows:
          </Typography>
          <Typography>P = 2 x S + 2</Typography>
          <Typography>Where:</Typography>
          <Typography>P: Price of the NFT ($)</Typography>
          <Typography>S: Current supply (number of NFTs minted)</Typography>
          <Typography>Season 1 Builder NFTs are non-transferable.</Typography>
        </Box>
        <Divider sx={{ borderColor: 'secondary.main' }} />
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            Spam Policy
          </Typography>
          <Typography>Scout Game automatically detects REJECTED Pull Requests from Builders.</Typography>
          <Typography>Each rejected Pull Request is treated as an abuse report.</Typography>
          <Typography>Qualified GitHub repo owners may report abuse in Scout Game.</Typography>
          <Typography>CharmVerse core team may also report abuse.</Typography>
          <Typography>Builders receiving 3 abuse reports will be permanently banned from the Scout Game.</Typography>
        </Box>
      </Stack>
      <ScrollButton scrollType='up' sx={{ textAlign: 'center', width: '100%' }}>
        back to top <ArrowDropUpIcon fontSize='small' />
      </ScrollButton>
    </Box>
  );
}
