import MuiVisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Tooltip } from '@mui/material';
import type { MouseEvent } from 'react';

export function VisibilityIcon({
  visible,
  size,
  onClick,
  visibleTooltip,
  hiddenTooltip
}: {
  visible: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: VoidFunction;
  visibleTooltip?: string;
  hiddenTooltip?: string;
}) {
  function handleClick(ev: MouseEvent) {
    ev.stopPropagation();
    onClick?.();
  }

  const icon = visible ? (
    <MuiVisibilityIcon fontSize={size} onClick={handleClick} />
  ) : (
    <VisibilityOffIcon fontSize={size} onClick={handleClick} />
  );

  const tooltip = visible ? visibleTooltip : hiddenTooltip;
  return <Tooltip title={tooltip ?? ''}>{icon}</Tooltip>;
}
