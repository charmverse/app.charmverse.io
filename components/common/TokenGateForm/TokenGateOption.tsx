import CheckIcon from '@mui/icons-material/Check';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import { useWeb3React } from '@web3-react/core';
import { TokenGateWithRoles } from 'lib/token-gates/interfaces';
import { humanizeAccessControlConditions } from 'lit-js-sdk';
import { useEffect, useState } from 'react';

interface Props {
  tokenGate: TokenGateWithRoles,
  onSelect: (tokenGate: TokenGateWithRoles) => void,
  isSelected: boolean,
  // Provide this so we don't show the toggle UI if there is only 1 token gate for the space
  totalGates: number
}

export default function TokenGateOption ({ tokenGate, isSelected, onSelect, totalGates }: Props) {

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
        onSelect(tokenGate);
      }}
    >
      <CardContent>
        <Grid container>
          <Grid item xs={10}>
            <Typography>
              {description}
            </Typography>
          </Grid>
          {
            totalGates > 1 && (
              <Grid item xs={2} display='flex' justifyContent='center' alignItems='center'>
                <ToggleButton
                  value='check'
                  color={isSelected ? 'primary' : 'secondary'}
                  selected={isSelected}
                  onChange={() => {
                    onSelect(tokenGate);
                  }}
                  size='small'

                >
                  <CheckIcon fontSize='small' sx={{ m: 0, p: 0 }} />
                </ToggleButton>
              </Grid>
            )
          }
        </Grid>
        <Grid item xs>
          {
            tokenGate.tokenGateToRoles.length > 0 && (
              <Typography color='secondary' sx={{ mt: 1 }}>
                Grants {tokenGate.tokenGateToRoles.length} role{tokenGate.tokenGateToRoles.length > 1 ? 's' : ''}
              </Typography>
            )
          }

        </Grid>

      </CardContent>
    </Card>
  );
}
