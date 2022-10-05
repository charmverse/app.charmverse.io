import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { humanizeAccessControlConditions } from 'lit-js-sdk';
import { useEffect, useState } from 'react';

import LoadingComponent from 'components/common/LoadingComponent';
import type { TokenGateWithRoles } from 'lib/token-gates/interfaces';

interface Props {
  tokenGate: TokenGateWithRoles;
  validGate?: boolean | null;
  isVerifying: boolean;
}

export default function TokenGateOption ({ tokenGate, validGate, isVerifying }: Props) {

  const { account } = useWeb3React();
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    humanizeAccessControlConditions({
      ...tokenGate.conditions as any,
      myWalletAddress: account || ''
    }).then(result => {
      setDescription(result);
    });
  }, [tokenGate]);

  // Extra styling if the user was able to verify with the gate
  const validGateBorderProps: SxProps<Theme> = validGate ? {
    borderColor: 'success.main',
    borderWidth: 1,
    borderStyle: 'solid'
  } : {};

  return (
    <Card
      variant='outlined'
      raised={validGate === true}
      color={validGate === true ? 'success' : 'default'}
      sx={{ my: 1, ...validGateBorderProps }}
    >
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={10}>
            <Typography>
              {description}
            </Typography>
          </Grid>
          <Grid item xs={2} display='flex' justifyContent='center' alignItems='center'>
            {isVerifying && (
              <LoadingComponent isLoading height='20px' size={25} />
            )}
            {
              !isVerifying && validGate && <CheckCircleIcon color='success' />
            }
            {
              !isVerifying && validGate === false && <CancelIcon color='error' />
            }
          </Grid>
          {
              tokenGate.tokenGateToRoles.length > 0 && (
                <Grid item xs spacing={1}>
                  <Typography sx={{ mr: 1 }} variant='caption'>
                    Roles
                  </Typography>
                  {
                tokenGate.tokenGateToRoles.map(role => <Chip variant='outlined' sx={{ mr: 2, fontWeight: validGate ? 'bold' : undefined }} color={validGate ? 'success' : 'secondary'} key={role.id} label={role.role.name} />)
              }
                </Grid>
              )
            }
        </Grid>
      </CardContent>
    </Card>
  );
}
