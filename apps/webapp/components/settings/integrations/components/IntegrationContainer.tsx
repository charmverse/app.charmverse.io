import { styled } from '@mui/material';
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
  title,
  subheader,
  expanded,
  setExpanded,
  isAdmin,
  isConnected,
  onCancel,
  children
}: {
  title: string;
  subheader: string;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  isAdmin: boolean;
  isConnected: boolean;
  onCancel?: () => void;
  children: ReactNode;
}) {
  function clickAction() {
    if (!isAdmin) return;
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
        sx={{ cursor: !expanded && isAdmin ? 'pointer' : undefined, p: 2 }}
        onClick={!expanded && isAdmin ? clickAction : undefined}
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
                disabled={!isAdmin}
                disabledTooltip='Admin role required'
                onClick={clickAction}
              >
                Connect
              </Button>
            )
          ) : (
            <Button
              startIcon={<CheckCircleOutlineOutlined />}
              color='secondary'
              disabled={!isAdmin}
              disabledTooltip='Admin role required'
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
