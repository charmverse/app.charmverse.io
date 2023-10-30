import SolanaSelectWallet from "./solanaConditionCreationFlow/SolanaSelectWallet";
import SolanaSelectNFT from "./solanaConditionCreationFlow/SolanaSelectNFT";
import SolanaMetaplexCollection from "./solanaConditionCreationFlow/SolanaMetaplexCollection";

const solanaTypesConfig = {
  conditionTypeID: 'solRpc',
  conditionTypes: {
    'wallet': SolanaSelectWallet,
    'nft': SolanaSelectNFT,
    'group': SolanaMetaplexCollection,
  },
  conditionTypeData: {
    wallet: { label: 'An Individual Wallet', img: null, requiresMultipleConditions: false},
    nft: { label: 'An Individual NFT', img: null, requiresMultipleConditions: false},
    group: { label: 'A Metaplex Collection', img: null, requiresMultipleConditions: false},
  },
  doNotAllowForNested: []
}

export {
  solanaTypesConfig
}
