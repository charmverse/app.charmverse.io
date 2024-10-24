import { Grid2 } from '@mui/material';
import Link from 'next/link';

import type { BuilderNFTContractData } from 'lib/contract/getContractData';

export function ContractDashboard(data: BuilderNFTContractData) {
  return (
    <Grid2 container gap={2}>
      <Grid2 size={{ xs: 12 }}>
        <h2>Proxy address</h2>
        <Link href={`https://optimism.blockscout.com/token/${data.contractAddress}`} target='_blank'>
          {data.contractAddress}
        </Link>
      </Grid2>
      <Grid2 size={{ xs: 12 }}>
        <h2>Current Admin</h2>
        <Link href={`https://optimism.blockscout.com/address/${data.currentAdmin}`} target='_blank'>
          {data.currentAdmin}
        </Link>
      </Grid2>
      <Grid2 size={{ xs: 12 }}>
        <h2>Current Implementation</h2>
        <Link href={`https://optimism.blockscout.com/address/${data.currentImplementation}`} target='_blank'>
          {data.currentImplementation}
        </Link>
      </Grid2>
      <Grid2 size={{ xs: 12 }}>
        <h2>Proceeds Receiver</h2>
        <Link href={`https://optimism.blockscout.com/address/${data.proceedsReceiver}`} target='_blank'>
          {data.proceedsReceiver}
        </Link>
      </Grid2>

      <Grid2 size={{ xs: 12 }}>
        <h2>Registered builders</h2>
        <p>{data.totalSupply.toString()}</p>
      </Grid2>
    </Grid2>
  );
}
