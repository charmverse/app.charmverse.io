// The following was pulled from https://github.com/mui/material-ui/blob/master/packages/mui-lab/src/TreeItem/TreeItemContent.js because there's no way to import from the module

import type { TreeItemContentProps } from '@mui/lab/TreeItem';
import { useTreeItem } from '@mui/lab/TreeItem';
import clsx from 'clsx';
import * as React from 'react';

const TreeItemContent = React.forwardRef<HTMLDivElement, TreeItemContentProps>((props, ref) => {
  const {
    classes,
    className,
    displayIcon,
    expansionIcon,
    icon: iconProp,
    label,
    nodeId,
    onClick,
    onMouseDown,
    ...other
  } = props;

  const {
    disabled,
    expanded,
    selected,
    focused,
    handleExpansion,
    handleSelection,
    preventSelection
  } = useTreeItem(nodeId);

  const icon = iconProp || expansionIcon || displayIcon;

  const handleMouseDown = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    preventSelection(event);

    if (onMouseDown) {
      onMouseDown(event);
    }
  }, [onMouseDown]);

  const handleClick = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    handleExpansion(event);
    handleSelection(event);

    if (onClick) {
      onClick(event);
    }
  }, [handleExpansion, handleSelection, onClick]);

  const newClassName = React.useMemo(() => clsx(className, classes.root, {
    [classes.expanded]: expanded,
    [classes.selected]: selected,
    [classes.focused]: focused,
    [classes.disabled]: disabled
  }), [className, expanded, selected, focused, disabled]);

  return (
    /* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions -- Key event is handled by the TreeView */
    <div
      className={newClassName}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      ref={ref as any}
      {...other}
    >
      <div className={classes.iconContainer}>{icon}</div>
      <div className={classes.label}>{label}</div>
    </div>
  );
});

export default React.memo(TreeItemContent);
