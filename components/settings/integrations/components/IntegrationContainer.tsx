import styled from '@emotion/styled';
import { Card, CardContent, CardHeader, Collapse, Divider, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';

const StyledCard = styled(Card)`
  .MuiCardHeader-action {
    margin: 0;
  }
`;

export function IntegrationContainer({
  expanded,
  setExpanded,
  title,
  isConnected,
  subheader,
  connectedSummary,
  disableConnectTooltip,
  children
}: {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  title: string;
  subheader: string;
  isConnected: boolean;
  connectedSummary?: ReactNode | string;
  disableConnectTooltip?: string;
  children: ReactNode;
}) {
  function clickAction() {
    setExpanded(!expanded);
  }
  return (
    <StyledCard variant='outlined'>
      <CardHeader
        disableTypography
        title={
          <Typography fontWeight='bold' lineHeight={1}>
            {title}
          </Typography>
        }
        subheader={<Typography variant='caption'>{subheader}</Typography>}
        sx={{ cursor: !expanded ? 'pointer' : undefined, p: 2 }}
        onClick={!expanded ? clickAction : undefined}
        action={
          !isConnected ? (
            expanded ? (
              <Button sx={{ width: 100 }} variant='text' onClick={clickAction}>
                Cancel
              </Button>
            ) : (
              <Button
                sx={{ width: 100 }}
                color='primary'
                disabled={!!disableConnectTooltip}
                disabledTooltip={disableConnectTooltip}
                onClick={clickAction}
              >
                Connect
              </Button>
            )
          ) : (
            <Button color='secondary' variant='outlined' sx={{ width: 100 }} onClick={clickAction}>
              Connected
            </Button>
          )
        }
      />
      <Divider />
      {/* <div style={{ position: 'relative' }}>
        <CardContent sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}>{connectedSummary}</CardContent>
      </div> */}
      <Collapse in={expanded}>
        <CardContent>{children}</CardContent>
      </Collapse>
    </StyledCard>
  );
}
