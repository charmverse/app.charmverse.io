import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { Box, Button, Divider, Grid, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { IntegrationType } from '../interfaces';

const StyledBox = styled(Box)`
  background-color:  ${({ theme }) => theme.palette.background.light};
  display: inline-flex;
  border-radius: 7px;
`;

const StyledButton = styled(Button)`
    border-radius: 7px;
`;

type IntegrationProps = {
    isInUse: boolean;
    icon: ReactNode;
    integrationType: IntegrationType;
    name: string;
    id: string;
    useIntegration: (type: IntegrationType) => void;
};

function Integration (props: IntegrationProps) {
  const { isInUse, icon, id, name, integrationType, useIntegration } = props;

  return (
    <Grid container spacing={1}>
      <Grid item container xs={10} direction='row' alignItems='center'>
        { icon }
        <Typography ml={1} variant='h2'>{ name }</Typography>
      </Grid>
      <Grid item container direction='row' xs={2}>
        {
          isInUse ? (<><CheckIcon /><Typography ml={1}>In use</Typography></>) : (
            <StyledButton
              onClick={() => useIntegration(integrationType)}
            >
              Use
            </StyledButton>
          )
        }
      </Grid>
      <Grid item xs={12}>
        <StyledBox sx={{ p: 0.5 }}>
          { id }
        </StyledBox>
      </Grid>
      <Grid item xs={12} py={1}>
        <Divider />
      </Grid>
    </Grid>
  );

}

export default Integration;
