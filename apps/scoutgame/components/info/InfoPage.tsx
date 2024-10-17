import { Link, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import Image from 'next/image';

import { Blockquote } from 'components/common/DocumentPageContainer/components/Blockquote';
import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from 'components/common/DocumentPageContainer/components/List';
import { DocumentPageContainer } from 'components/common/DocumentPageContainer/DocumentPageContainer';

export function InfoPage() {
  return (
    <DocumentPageContainer data-test='info-page'>
      <Image
        src='/images/info/info_banner.png'
        width={854}
        height={285}
        style={{
          maxWidth: '100%',
          height: 'auto'
        }}
        priority={true}
        alt='info banner'
      />
      <Typography variant='h4' align='center' color='secondary'>
        All about Scout Game!
      </Typography>
      <Document />
    </DocumentPageContainer>
  );
}

function Document() {
  return (
    <>
      <InfoCard title='TL;DR'>
        <Typography>
          Think fantasy sports for open-source development. Collect builder NFTs, earn points when they merge Pull
          Requests in approved repositories, and win rewards. Some projects even offer additional crypto incentives.
        </Typography>
        <List>
          <ListItem>Anyone can scout a builder by buying NFTs representing that builder</ListItem>
          <ListItem>
            A builder can claim Scout Gems after performing Qualified Actions like a merged pull request in a Qualified
            GitHub Repository
          </ListItem>
          <ListItem>
            At the end of each week, Builders are ranked by the number of Gems they collect. Scout Points are allocated
            to the top-ranking Builders and the Scouts who hold their NFTs
          </ListItem>
          <ListItem>Scouts and Builders can claim Scout Points at the end of each week</ListItem>
          <ListItem>Scout Points are only claimable for the last and current seasons (3 months each)</ListItem>
        </List>
      </InfoCard>
      <InfoCard title='What is Scout Game?'>
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
          within onchain ecosystems. As a Scout, your goal is to recognize promising builders early in their journey and
          help them gain visibility. In return, you earn rewards based on their success.
        </Typography>
      </InfoCard>
      <InfoCard title='How it works for Scouts'>
        <Typography>Step into the shoes of an onchain Scout.</Typography>
        <Typography>
          Scouts participate by collecting NFTs associated with top builders during each season. As these builders
          excel—by contributing to codebases—Scouts accumulate points. The more successful your chosen builders, the
          more points you earn.
        </Typography>
        <Typography>
          By accumulating Scout Points, you can exchange them to scout even more builders, boosting your standing within
          the game and increasing your potential rewards.
        </Typography>
        <div>
          <Typography variant='h6' color='secondary' mt={2}>
            Key Scout Actions:
          </Typography>
          <List>
            <ListItem>Collect NFTs from top builders every season.</ListItem>
            <ListItem>Earn Scout Points when the builders you back succeed in open-source contributions.</ListItem>
          </List>
        </div>
      </InfoCard>
      <InfoCard title='How it works for Builders'>
        <Typography>Join the Scout Game as a Builder and connect your GitHub account.</Typography>
        <Typography>
          Builders in the Scout Game gain recognition by actively contributing to approved projects. Each season lasts
          three months, and builders earn Scout Gems weekly by completing specific tasks tied to their contributions. At
          the end of each week, Scout Gems are converted to Scout Points depending on the Builder’s rank.
        </Typography>
        <Typography variant='h6' color='secondary' mt={2}>
          Key Builder Actions:
        </Typography>
        <div>
          <Typography>Collect Gems for completing qualified actions:</Typography>
          <List>
            <ListItem>Commit code to an approved open-source project</ListItem>
            <ListItem>Contribute to approved open-source projects with an accepted Pull Request</ListItem>
            <ListItem>Make your mark with a first-time code contribution to an approved project</ListItem>
            <ListItem>Hit a 3-Pull Request streak within 7 days</ListItem>
          </List>
        </div>
        <div>
          <Typography>Approved Open-Source Project Owners</Typography>
          <List>
            <ListItem>
              <Link
                href='https://docs.google.com/spreadsheets/d/1K-p1ekVWzc062Z9xlmObwWSjjt5aWLeZZL3zS0e77DE/edit?usp=sharing'
                target='_blank'
                rel='noopener'
              >
                https://docs.google.com/spreadsheets/d/1K-p1ekVWzc062Z9xlmObwWSjjt5aWLeZZL3zS0e77DE/edit?usp=sharing
              </Link>
            </ListItem>
          </List>
        </div>
      </InfoCard>
      <InfoCard title='Scout Points'>
        <Typography>Scouts and Builders are rewarded in-game with Scout Points.</Typography>
        <Typography>
          Scout Points are claimable at the end of each week and remain claimable for only the current season and the
          next season.
        </Typography>
        <Typography variant='h6' color='secondary' mt={2}>
          Weekly Builder Ranking & Reward Allocation
        </Typography>
        <Typography>
          Scout Game runs in seasons. Each season is 13 weeks. During each week, Builders collect Scout Gems by
          completing qualified actions.
        </Typography>
        <Table sx={{ '& *': { px: 0 } }} aria-label='action table'>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell align='right'>Reward</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ '& td, & th': { border: 0 } }}>
            <TableRow>
              <TableCell>One commit to a Qualified GitHub Repository (max 1 gem per day)</TableCell>
              <TableCell align='center'>1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>One merged Pull Request in a Qualified GitHub Repository</TableCell>
              <TableCell align='center'>10</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                3rd Pull Request of a streak of 3 Merged Pull Requests in Qualified GitHub Repositories within a sliding
                7-day window
              </TableCell>
              <TableCell align='center'>30</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>First Pull Request in a Qualified GitHub Repository</TableCell>
              <TableCell align='center'>100</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Typography>A Builder may only score Gems for one PR per approved repo per day.</Typography>
        <Typography>Gem rewards do not stack. The maximum score for a single PR is 100 Gems.</Typography>
        <Typography>
          At the end of each week, Builders are ranked by the number of Gems they collected that week. Scout Points are
          allocated to the top-ranking Builders and the Scouts who hold their NFTs according to this formula:
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
            Scout<sub>R,H</sub> Reward = 80% x (H / S) x Reward<sub>R</sub>
          </Typography>
          <Typography>Where</Typography>
          <Typography>
            R = Builder's rank that week
            <br />H = Number of the Builder's NFTs owned by the Scout
            <br />S = Total number of the Builder's NFTs minted
          </Typography>
        </Blockquote>
        <Typography>A Builder's Gem count resets to zero at the start of each week.</Typography>
        {/* the id is used to scroll to the section from checkout  */}
        <Typography id='builder-nfts' variant='h6' color='secondary' mt={2}>
          Builder NFTs
        </Typography>
        <Typography>
          Builder NFTs can be purchased with Eth, USDC, or USDT on Base, OP or Arb. Scout Points can also be used to
          purchase Builder NFTs. Builders receive 20% of the proceeds from their NFT sales in Scout Points.
        </Typography>
        <Typography>
          The price of a Builder's first NFT mint is 20 Scout Points. The price of the next NFT of the same Builder is
          calculated as follows:
        </Typography>
        <Blockquote>
          <Typography align='center' my={1}>
            <code>P = 20 x S + 20</code>
          </Typography>
          <Typography>Where:</Typography>
          <Typography>
            P: Price of the NFT (Scout Points)
            <br />
            S: Current supply (number of NFTs minted)
          </Typography>
        </Blockquote>
        <Typography>Season 1 Builder NFTs are non-transferable.</Typography>
      </InfoCard>
      <InfoCard title='Spam Policy'>
        <Typography>Scout Game automatically detects REJECTED Pull Requests from Builders.</Typography>
        <List>
          <ListItem>
            <Typography>Each rejected Pull Request is treated as an abuse report.</Typography>
          </ListItem>
          <ListItem>
            <Typography>Qualified GitHub repo owners may report abuse in Scout Game.</Typography>
          </ListItem>
          <ListItem>
            <Typography>Scout Game core team may also report abuse.</Typography>
          </ListItem>
          <ListItem>
            <Typography>
              Builders receiving 3 abuse reports will be suspended from the Scout Game and unable to score points
            </Typography>
          </ListItem>
          <ListItem>
            <Typography>
              A suspended Builder may appeal to rejoin the Scout Game.
              <br /> Submit an appeal here:{' '}
              <Link href='https://appeal.scoutgame.xyz' target='_blank'>
                https://appeal.scoutgame.xyz
              </Link>
            </Typography>
          </ListItem>
        </List>
      </InfoCard>
      <InfoCard title='Partner Rewards'>
        <Typography>
          Scout Game is partnering with Celo, Game7, Moxie and Bountycaster to reward builders for doing what they do
          best! Find details about each partnership on the following pages:
        </Typography>
        <List>
          <ListItem>
            <Link href='/info/partner-rewards/celo'>Celo</Link>
          </ListItem>
          <ListItem>
            <Link href='/info/partner-rewards/game7'>Game7</Link>
          </ListItem>
          <ListItem>
            <Link href='/info/partner-rewards/moxie'>Moxie</Link>
          </ListItem>
          <ListItem>
            <Link href='/info/partner-rewards/bountycaster'>BountyCaster</Link>
          </ListItem>
        </List>
      </InfoCard>
    </>
  );
}
