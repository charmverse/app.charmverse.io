import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useWeb3React } from '@web3-react/core';
import { TokenGateWithRoles } from 'lib/token-gates/interfaces';
import { humanizeAccessControlConditions } from 'lit-js-sdk';
import { useEffect, useState } from 'react';

interface Props {
  tokenGate: TokenGateWithRoles,
  select: (tokenGate: TokenGateWithRoles) => void,
  isSelected: boolean
}

export default function TokenGateOption ({ tokenGate, isSelected, select }: Props) {

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

  return (
    <Card
      variant='outlined'
      raised={isSelected}
      sx={{ my: 1 }}
      onClick={() => {
        select(tokenGate);
      }}
    >
      <CardContent>
        <Grid container>
          <Grid item xs={10}>
            <Typography>
              {description}
            </Typography>
          </Grid>
          <Grid item xs={2} display='flex' justifyContent='center' alignItems='center'>
            {
            isSelected && (<CheckCircleIcon color='success' />)
          }
          </Grid>
        </Grid>

      </CardContent>
    </Card>
  );
}
