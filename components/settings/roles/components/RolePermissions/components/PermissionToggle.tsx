import { FormControlLabel, Switch, Tooltip } from '@mui/material';
import type { ChangeEvent } from 'react';

import type { UpgradeContext } from 'components/settings/subscription/UpgradeWrapper';
import { UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';

export function PermissionToggle(props: {
  label: string;
  defaultChecked?: boolean;
  disabled: boolean;
  memberChecked?: boolean; // if this permission is inherited from the Member role
  ['data-test']?: string;
  onChange: (ev: ChangeEvent<HTMLInputElement>) => void;
  upgradeContext?: UpgradeContext;
}) {
  const { isFreeSpace } = useIsFreeSpace();
  // const disabled = props.disabled;
  // const defaultChecked = props.memberChecked || props.defaultChecked;
  const useDefault = typeof props.defaultChecked !== 'boolean';

  return (
    <FormControlLabel
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        margin: 0
      }}
      control={
        typeof props.defaultChecked === 'boolean' || typeof props.memberChecked === 'boolean' ? (
          <Tooltip title={useDefault && !isFreeSpace ? 'Default setting' : ''}>
            <span
              style={{
                opacity: useDefault && !isFreeSpace ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <UpgradeWrapper upgradeContext={props.upgradeContext}>
                <Switch
                  // key={`${props.label}-${defaultChecked}`}
                  data-test={props['data-test']}
                  disabled={props.disabled}
                  checked={useDefault ? props.memberChecked : props.defaultChecked}
                  onChange={props.onChange}
                />
              </UpgradeWrapper>
            </span>
          </Tooltip>
        ) : (
          // placeholder element while loading
          <Switch sx={{ visibility: 'hidden' }} disabled={true} />
        )
      }
      label={props.label}
      labelPlacement='start'
    />
  );
}
