import { ethereumTypesConfig } from '../../chainComponents/ethereum/ethereumTypesConfig.js';
import { solanaTypesConfig } from '../../chainComponents/solana/solanaTypesConfig.js';

const defaultAllowedChainsObj = {
  ethereum: ethereumTypesConfig,
  solana: solanaTypesConfig
}

export {
  defaultAllowedChainsObj,
}
