import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { currentSeason } from '@packages/scoutgame/dates';

const fids = [
  {
    fid: 547807,
    description:
      'Piesrtasty is the co-founder of DeFi platform HAI and the lead developer at Reflexer Finance, the team behind the RAI stablecoin, which Vitalik has called an "ideal type of a collateralized automated stablecoin”'
  },
  {
    fid: 841580,
    description:
      "Huss Martinez is a software developer contributing to the Gitcoin ecosystem. Huss's work focuses on enhancing the platform's functionality and user experience, aligning with Gitcoin's mission to build and fund the open web together."
  },
  {
    fid: 19412,
    description:
      "Carl Cervone leads the development of Open Source Observer (OSO), an analytics platform that measures the impact of open-source software projects to assist foundations and ecosystem funds in effective resource allocation. Carl is a member of the Optimism Citizen's House where he contributes his analytics experience and the OSO platform to Optimism Retro Funding Rounds."
  },
  {
    fid: 420564,
    description:
      'Gabriel Temsten is a full-stack developer specializing in blockchain technologies. Gabe actively shares his knowledge through tutorials, such as building a basic smart contract and dApp on Celo. Gabe has one the Scout Game Celo partners rewards multiple times for his work on Celo’s Glo Wallet.'
  },
  {
    fid: 1043,
    description:
      "James Kim is a developer at Optimism, contributing to the Supersim project—a local development environment that simulates the Optimism Superchain. James's work on Supersim facilitates the development and testing of applications within the Superchain ecosystem, enhancing the efficiency and effectiveness of cross-chain interactions."
  },
  {
    fid: 1656,
    description:
      'Dan, known as web3pm, is the co-founder and developer of Icebreaker, a platform designed to enhance community engagement and networking within the Web3 ecosystem. As an "identity mixologist," Dan focuses on creating tools that facilitate meaningful connections among users. He actively participates in the Farcaster community, sharing insights and updates on Icebreaker\'s features and developments.'
  },
  {
    fid: 1689,
    description:
      "Stephan is a prolific open-source developer specializing in cryptography, permissionless protocols, and embedded systems. He created Lazy Indexer for selective data indexing on the Farcaster protocol. Stephan's contributions also include Open Browser Wallet, a passkey-based browser wallet, and Farcaster Signer Tools for managing Farcaster signers."
  },
  {
    fid: 4179,
    description:
      'Maurelian.eth is a protocol security engineer at OP Labs, a core developer of the OP Stack within the Optimism ecosystem. He has been instrumental in proposing and implementing protocol upgrades to enhance the security and decentralization of the Superchain.'
  },
  {
    fid: 616,
    description:
      'Dylan Steck, known as dylsteck.eth, is a pioneering developer in the Farcaster ecosystem. He created FarHack, a hackathon platform first utilized at FarCon and subsequently adopted at other conferences. Currently, Dylan is developing Cortex, a project aimed at enhancing user interaction within the Farcaster network'
  },
  {
    fid: 5781,
    description:
      'Pedro Pregueiro is a developer and co-founder of Camp, a leading Nouns DAO governance client. With a background in startups and technical leadership, Pedro combines his passion for innovative solutions with a deep appreciation for music and culinary exploration.'
  },
  {
    fid: 4199,
    description:
      'Michael Gingras, known as lilfrog.eth, is a key contributor to Agora, an open-source governance client. He is also active in the crypto community, engaging with platforms like Farcaster and is a top Scout Game Builders'
  }
];

export async function getEditorialDescription({ fid }: { fid: number }) {
  const description = fids.find((f) => f.fid === fid)?.description;
  return description ?? '';
}
