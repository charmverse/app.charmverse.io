'use client';

import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box, Card, CardContent, Container, List, ListItem, Stack, Typography, Divider, styled } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/types';
import Image from 'next/image';

import { ScrollButton } from './components/ScrollButton';

const Blockquote = styled('div')`
  background-color: var(--mui-palette-background-light);
  padding: calc(2 * var(--mui-spacing));
`;

export function InfoPage() {
  return (
    <Container data-test='info-page' maxWidth='md'>
      <Stack my={10} gap={10} mx='auto' width='854px' maxWidth='100%'>
        <Image
          src='/images/info_banner.png'
          width={854}
          height={285}
          sizes='100vw'
          style={{
            maxWidth: '100%',
            height: 'auto'
          }}
          alt=''
        />
        <Typography variant='h4' align='center' color='secondary'>
          All about Scout Game!
        </Typography>
        <LearnMore />
        <ScrollButton scrollType='up' sx={{ textAlign: 'center', width: '100%' }}>
          back to top <ArrowDropUpIcon fontSize='small' />
        </ScrollButton>
      </Stack>
    </Container>
  );
}

function InfoCard({ children }: PropsWithChildren) {
  return (
    <Card variant='outlined' color='secondary' sx={{ width: '100%', mx: 'auto' }}>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function LearnMore() {
  return (
    <>
      <InfoCard>
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            TL;DR
          </Typography>
          <Typography>
            Think fantasy sports for open-source development. Collect builder NFTs, earn points when they merge Pull
            Requests in approved repositories, and win rewards. Some projects even offer additional crypto incentives.
          </Typography>
          <List sx={{ listStyleType: 'disc', ml: 2 }}>
            <ListItem sx={{ display: 'list-item' }}>
              Anyone can scout a builder by buying NFTs representing that builder
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              A builder can claim Scout Gems after performing Qualified Actions like a merged pull request in a
              Qualified GitHub Repository
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
      </InfoCard>
      <InfoCard>
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            What is the Scout Game?
          </Typography>
          <Typography>Here’s your new mission: Become a Scout and hunt for the next big onchain builders.</Typography>
          <Typography>
            Your role? Spot them early and help them rise to the top. As they climb to success, you rake in rewards for
            backing the right talent.
          </Typography>
          <Typography>
            Forget gambling. This is about growth. Back real talent, watch them thrive, and share in the success.
          </Typography>
          <Typography>
            The Scout Game is designed to reward individuals for identifying and supporting emerging developer talent
            within onchain ecosystems. As a Scout, your goal is to recognize promising builders early in their journey
            and help them gain visibility. In return, you earn rewards based on their success.
          </Typography>
        </Box>
      </InfoCard>
      <InfoCard>
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
          <div>
            <Typography variant='h5' mt={2}>
              Key Scout Actions:
            </Typography>
            <List sx={{ listStyleType: 'disc', ml: 2 }}>
              <ListItem sx={{ display: 'list-item' }}>Collect NFTs from top builders every season.</ListItem>
              <ListItem sx={{ display: 'list-item' }}>
                Earn Scout Points when the builders you back succeed in open-source contributions.
              </ListItem>
            </List>
          </div>
        </Box>{' '}
      </InfoCard>
      <InfoCard>
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            How it works for Builders
          </Typography>
          <Typography>Join the Scout Game as a Builder and connect your GitHub account.</Typography>
          <Typography>
            Builders in the Scout Game gain recognition by actively contributing to approved projects. Each season lasts
            three months, and builders earn Scout Gems weekly by completing specific tasks tied to their contributions.
            At the end of each week, Scout Gems are converted to Scout Points depending on the Builder’s rank.
          </Typography>
          <div>
            <Typography variant='h5' mt={2}>
              Key Builder Actions:
            </Typography>
            <Typography>Collect Gems for completing qualified actions:</Typography>
            <List sx={{ listStyleType: 'disc', ml: 2 }}>
              <ListItem sx={{ display: 'list-item' }}>
                Contribute to approved open-source projects with an accepted Pull Request
              </ListItem>
              <ListItem sx={{ display: 'list-item' }}>
                Make your mark with a first-time code contribution to an approved project
              </ListItem>
              <ListItem sx={{ display: 'list-item' }}>Hit a 3-Pull Request streak within 7 days</ListItem>
            </List>
          </div>
        </Box>
      </InfoCard>
      <InfoCard>
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            Scout Points
          </Typography>
          <Typography>Scouts and Builders are rewarded in-game with Scout Points.</Typography>
          <Typography>
            Scout Points are claimable at the end of each week and remain claimable for only the current season and the
            next season.
          </Typography>
          <Typography variant='h5' mt={2}>
            Weekly Builder Ranking & Reward Allocation
          </Typography>
          <Typography>
            Scout Game runs in seasons. Each season is 13 weeks. During each week, Builders collect Scout Gems by
            completing qualified actions.
          </Typography>
          <List sx={{ listStyleType: 'disc', ml: 2 }}>
            <ListItem sx={{ display: 'list-item' }}>
              <Typography>One merged Pull Request in a Qualified GitHub Repository = 1 Gem</Typography>
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <Typography>
                3rd Pull Request of a streak of 3 Merged Pull Requests in Qualified GitHub Repositories within a 7-day
                window = 3 Gems
              </Typography>
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <Typography>First Pull Request in a Qualified GitHub Repository = 10 Gems</Typography>
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <Typography>A Builder may only score Gems for one PR per approved repo per day.</Typography>
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <Typography>Gem rewards do not stack. The maximum score for a single PR is 10 Gems.</Typography>
            </ListItem>
          </List>
          <Typography>
            At the end of each week, Builders are ranked by the number of Gems they collected that week. Scout Points
            are allocated to the top-ranking Builders and the Scouts who hold their NFTs according to this formula:
          </Typography>
          <Blockquote>
            <Typography align='center' my={1}>
              <code>
                Reward<sub>R</sub> = A X [(1 - D)<sup>^(R-1)</sup> - (1 - D)<sup>^R</sup>]
              </code>
            </Typography>
            <Typography>Where</Typography>
            <Typography>
              A = Total Scout Point Allocation for the Week
              <br />R = Rank
              <br />D = Decay Rate = 3%
            </Typography>
          </Blockquote>
          <Typography>The reward is split between the Builder and their scouts as follows:</Typography>
          <Typography>
            Builder<sub>R</sub> Reward = 20% x Reward<sub>R</sub>
          </Typography>
          <Blockquote>
            <Typography>
              Scout<sub>R</sub> Reward = 80% x (H / S) x Reward<sub>R</sub>
            </Typography>
            <Typography>Where</Typography>
            <Typography>
              R = Builder's rank that week
              <br />H = Number of the Builder's NFTs owned by the Scout
              <br />S = Total number of the Builder's NFTs minted
            </Typography>
          </Blockquote>
          <Typography>A Builder's Gem count resets to zero at the start of each week.</Typography>
          <Typography variant='h5' mt={2}>
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
          <Blockquote>
            <Typography align='center' my={1}>
              <code>P = 2 x S + 2</code>
            </Typography>
            <Typography>Where:</Typography>
            <Typography>
              P: Price of the NFT ($)
              <br />
              S: Current supply (number of NFTs minted)
            </Typography>
          </Blockquote>
          <Typography>Season 1 Builder NFTs are non-transferable.</Typography>
        </Box>
      </InfoCard>
      <InfoCard>
        <Box display='flex' flexDirection='column' gap={2} my={2}>
          <Typography variant='h4' textAlign='center' color='secondary'>
            Spam Policy
          </Typography>
          <Typography>Scout Game automatically detects REJECTED Pull Requests from Builders.</Typography>
          <List sx={{ listStyleType: 'disc', ml: 2 }}>
            <ListItem sx={{ display: 'list-item' }}>
              <Typography>Each rejected Pull Request is treated as an abuse report.</Typography>
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <Typography>Qualified GitHub repo owners may report abuse in Scout Game.</Typography>
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <Typography>CharmVerse core team may also report abuse.</Typography>
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <Typography>
                Builders receiving 3 abuse reports will be permanently banned from the Scout Game.
              </Typography>
            </ListItem>
          </List>
        </Box>
      </InfoCard>
    </>
  );
}
