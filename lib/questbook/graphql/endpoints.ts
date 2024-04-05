export const endpoints = {
  10: 'https://the-graph.questbook.app/subgraphs/name/qb-subgraph-optimism-mainnet',
  137: 'https://the-graph.questbook.app/subgraphs/name/qb-subgraph-polygon-mainnet'
} as const;

export type ChainId = keyof typeof endpoints;

export const QUESTBOOK_SUPPORTED_CHAINS = Object.keys(endpoints).map(Number) as ChainId[];
