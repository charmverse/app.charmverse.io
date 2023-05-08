import { getSafeTxStatus } from "lib/gnosis/getSafeTxStatus";

async function test(){
  const res = await getSafeTxStatus({safeTxHash: '0xfe0df7ccebdfa7bcd1eae5ec80382a7c5d77a0d299e4ef9ba804ff44495e27b1', chainId: 137});
  console.log('🔥', res);
}

test();

