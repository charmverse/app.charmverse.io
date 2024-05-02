import styled from '@emotion/styled';
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';
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
  onCancel,
  disableConnectTooltip,
  children
}: {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  onCancel?: () => void;
  title: string;
  subheader: string;
  isConnected: boolean;
  disableConnectTooltip?: string;
  children: ReactNode;
}) {
  function clickAction() {
    setExpanded(!expanded);
  }

  // a special handler to allow forms to reset themselves on cancel
  function cancelAction() {
    setExpanded(false);
    onCancel?.();
  }

  return (
    <StyledCard variant='outlined' data-test={`integration-${title}`}>
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
              <Button sx={{ width: 100 }} variant='text' onClick={cancelAction}>
                Cancel
              </Button>
            ) : (
              <Button
                sx={{ width: 100 }}
                color='primary'
                data-test='connect-button'
                disabled={!!disableConnectTooltip}
                disabledTooltip={disableConnectTooltip}
                onClick={clickAction}
              >
                Connect
              </Button>
            )
          ) : (
            <Button
              startIcon={<CheckCircleOutlineOutlined />}
              color='secondary'
              variant='outlined'
              sx={{ width: 130 }}
              onClick={clickAction}
            >
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
