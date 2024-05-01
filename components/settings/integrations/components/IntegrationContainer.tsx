import { Card, CardContent, CardHeader, Collapse, Divider, Slide } from '@mui/material';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';

export function IntegrationContainer({
  expanded,
  setExpanded,
  title,
  isConnected,
  connectedSummary,
  disableConnectTooltip,
  children
}: {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  title: string;
  isConnected: boolean;
  connectedSummary?: ReactNode | string;
  disableConnectTooltip?: string;
  children: ReactNode;
}) {
  function clickAction() {
    setExpanded(!expanded);
  }
  return (
    <Card variant='outlined'>
      <CardHeader
        subheader={<strong>{title}</strong>}
        sx={{ cursor: !expanded ? 'pointer' : undefined, p: 3 }}
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
    </Card>
  );
}
