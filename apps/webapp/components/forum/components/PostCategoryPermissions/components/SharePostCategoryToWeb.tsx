import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { UpgradeChip, UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';

type Props = {
  isChecked: boolean;
  disabled: boolean;
  disabledTooltip?: string;
  onChange?: () => void;
};

export function SharePostCategoryToWeb({ disabled, isChecked, disabledTooltip, onChange }: Props) {
  return (
    <Box>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='body2'>Public category</Typography>

        <Tooltip title={disabledTooltip && disabled ? disabledTooltip : ''}>
          <Box display='flex' alignItems='center'>
            <UpgradeChip upgradeContext='forum_permissions' />
            <UpgradeWrapper upgradeContext={!disabledTooltip ? 'forum_permissions' : undefined}>
              <Switch data-test='toggle-public-page' checked={isChecked} disabled={disabled} onChange={onChange} />
            </UpgradeWrapper>
          </Box>
        </Tooltip>
      </Box>
      <Typography variant='caption'>
        {!isChecked
          ? 'Only space members with relevant permissions can view this category.'
          : 'Anyone on the web can view this category.'}
      </Typography>
    </Box>
  );
}
