import {
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '../../common/List';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function CeloPage() {
  return (
    <InfoPageContainer data-test='partner-celo-page' image='/images/info/rewards-partner-celo.jpg' title='Celo'>
      <Document />
    </InfoPageContainer>
  );
}

const tiers = [
  {
    name: 'Common',
    reward: '50 cUSD'
  },
  {
    name: 'Rare',
    reward: '150 cUSD'
  },
  {
    name: 'Epic',
    reward: '250 cUSD'
  },
  {
    name: 'Legendary',
    reward: '350 cUSD'
  },
  {
    name: 'Mythic',
    reward: '450 cUSD'
  }
];

function Document() {
  return (
    <InfoCard>
      <Typography>
        Celo is partnering with Scout Game to support builders who contribute to the ecosystem. Celo has a prize pool of
        5000 cUSD to distribute to talented Builders!
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        Qualified projects will mark their issues with a Tier in GitHub. The Tier determines the builder's reward for
        merging a PR that addresses the issue. Unmarked issues will default to the Common Tier.
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>GitHub Issue Tier</TableCell>
            <TableCell align='right'>Reward</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tiers.map((tier) => (
            <TableRow key={tier.name}>
              <TableCell>{tier.name}</TableCell>
              <TableCell align='right'>{tier.reward}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography variant='h6' color='secondary' mt={2}>
        How to contribute
      </Typography>
      <Typography>
        <Link href='https://docs.celo.org/general/ecosystem/contributors' target='_blank' rel='noreferrer'>
          Learn how to contribute to Celo
        </Link>
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        Qualified Celo Projects:
      </Typography>
      <List>
        <ListItem>
          <Link href='https://github.com/celo-org/faucet' target='_blank' rel='noreferrer'>
            https://github.com/celo-org/faucet
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/mento-protocol/mento-web' target='_blank' rel='noreferrer'>
            https://github.com/mento-protocol/mento-web
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/mento-protocol/reserve-site' target='_blank' rel='noreferrer'>
            https://github.com/mento-protocol/reserve-site
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/mento-protocol/mento-web' target='_blank' rel='noreferrer'>
            https://github.com/mento-protocol/mento-web
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/mento-protocol/mento-sdk' target='_blank' rel='noreferrer'>
            https://github.com/mento-protocol/mento-sdk
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/celo-org/celo-composer' target='_blank' rel='noreferrer'>
            https://github.com/celo-org/celo-composer
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/valora-inc/hooks' target='_blank' rel='noreferrer'>
            https://github.com/valora-inc/hooks
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/GoodDollar/GoodWeb3-Mono' target='_blank' rel='noreferrer'>
            https://github.com/GoodDollar/GoodWeb3-Mono
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/GoodDollar/GoodCollective' target='_blank' rel='noreferrer'>
            https://github.com/GoodDollar/GoodCollective
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/Glo-Foundation/glo-wallet' target='_blank' rel='noreferrer'>
            https://github.com/Glo-Foundation/glo-wallet/issues
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/Ubeswap/ubeswap-interface-v3' target='_blank' rel='noreferrer'>
            https://github.com/Ubeswap/ubeswap-interface-v3
          </Link>
        </ListItem>
        <ListItem>
          <Link href='https://github.com/gitcoinco/grants-stack' target='_blank' rel='noreferrer'>
            https://github.com/gitcoinco/grants-stack
          </Link>
        </ListItem>
      </List>
    </InfoCard>
  );
}
