export type BlockRange = {
  fromBlock?: bigint | number;
  toBlock?: bigint | number;
};

export function convertBlockRange({ fromBlock, toBlock }: BlockRange): {
  fromBlock: bigint | undefined;
  toBlock: bigint | undefined;
} {
  return {
    fromBlock: !fromBlock ? undefined : typeof fromBlock === 'bigint' ? fromBlock : BigInt(fromBlock),
    toBlock: !toBlock ? undefined : typeof toBlock === 'bigint' ? toBlock : BigInt(toBlock)
  };
}
