import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { Box, Divider, Grid, Typography } from '@mui/material';
import Button from 'components/common/Button';
import CheckIcon from '@mui/icons-material/Check';
import { IdentityType } from 'models';

const StyledBox = styled(Box)`
  background-color: ${({ theme }) => theme.palette.background.light};
  display: inline-flex;
  border-radius: 7px;
  padding: 5px 7px;
`;

type IntegrationProps = {
    isInUse: boolean;
    icon: ReactNode;
    actions?: Array<{ name: string; action: () => void; }>;
    identityType: IdentityType;
    name: string;
    id: string;
    useIntegration: (id: string, type: IdentityType) => void;
};

function Integration (props: IntegrationProps) {
  const { isInUse, icon, actions = [], id, name, identityType, useIntegration } = props;

  return (
    <Grid container spacing={1}>
      <Grid item container xs={10} direction='row' alignItems='end'>
        { icon }
        <Typography ml={1} component='span' fontSize='1.4em' fontWeight={700}>{ name }</Typography>
      </Grid>
      <Grid item container direction='column' xs={2} spacing={1}>
        <Grid item container direction='row'>
          {
            isInUse ? (<><CheckIcon /><Typography ml={1}>In use</Typography></>) : (
              <Button
                onClick={() => useIntegration(id, identityType)}
              >
                Use
              </Button>
            )
          }
        </Grid>
      </Grid>
      <Grid item xs={10}>
        <StyledBox>
          { id }
        </StyledBox>
      </Grid>
      <Grid item xs={2}>
        {
          actions.map((item: { name: string; action: () => void; }) => (
            <Grid item container direction='row' key={name}>
              <Button
                onClick={() => item.action()}
              >
                {item.name}
              </Button>
            </Grid>
          ))
        }
      </Grid>
      <Grid item xs={12} py={2}>
        <Divider />
      </Grid>
    </Grid>
  );

}

export default Integration;
