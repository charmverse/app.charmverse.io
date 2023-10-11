// The following was pulled from https://github.com/mui/material-ui/blob/master/packages/mui-lab/src/TreeItem/TreeItemContent.js because there's no way to import from the module

import styled from '@emotion/styled';
import type { TreeItemContentProps } from '@mui/lab/TreeItem';
import { useTreeItem, treeItemClasses } from '@mui/lab/TreeItem';
import { alpha } from '@mui/material/styles';
import clsx from 'clsx';
import { forwardRef, useCallback, memo, useEffect, useMemo } from 'react';

const StyledTreeItemContent = styled.div(({ theme }) => ({
  padding: '0 8px',
  width: '100%',
  boxSizing: 'border-box', // prevent width + padding to overflow
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  // disable hover UX on ios which converts first click to a hover event
  '@media (pointer: fine)': {
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    }
  },
  [`&.${treeItemClasses.disabled}`]: {
    opacity: theme.palette.action.disabledOpacity,
    backgroundColor: 'transparent'
  },
  [`&.${treeItemClasses.focused}`]: {
    backgroundColor: theme.palette.action.focus
  },
  [`&.${treeItemClasses.selected}`]: {
    backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
    // disable hover UX on ios which converts first click to a hover event
    '@media (pointer: fine)': {
      '&:hover': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity
        )
      }
    },
    [`&.${treeItemClasses.focused}`]: {
      backgroundColor: alpha(
        theme.palette.primary.main,
        theme.palette.action.selectedOpacity + theme.palette.action.focusOpacity
      )
    }
  },
  [`& .${treeItemClasses.iconContainer}`]: {
    marginRight: 4,
    width: 15,
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    '& svg': {
      fontSize: 18
    }
  },
  [`& .${treeItemClasses.label}`]: {
    paddingLeft: 4,
    width: '100%',
    boxSizing: 'border-box', // prevent width + padding to overflow
    // fixes overflow - see https://github.com/mui/material-ui/issues/27372
    minWidth: 0,
    position: 'relative'
    // ...theme.typography.body1
  }
}));
const TreeItemContent = forwardRef<HTMLDivElement, TreeItemContentProps>((props, ref) => {
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

  const { disabled, expanded, selected, focused, handleExpansion, handleSelection, preventSelection } =
    useTreeItem(nodeId);

  const icon = iconProp || expansionIcon || displayIcon;

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      preventSelection(event);

      if (onMouseDown) {
        onMouseDown(event);
      }
    },
    [onMouseDown]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      handleExpansion(event);
      handleSelection(event);

      if (onClick) {
        onClick(event);
      }
    },
    [handleExpansion, handleSelection, onClick]
  );
  const newClassName = useMemo(
    () =>
      clsx(classes.root, {
        [classes.expanded]: expanded,
        [classes.selected]: selected,
        [classes.focused]: focused,
        [classes.disabled]: disabled
      }),
    [className, expanded, selected, focused, disabled]
  );

  return (
    /* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions -- Key event is handled by the TreeView */
    <StyledTreeItemContent
      className={newClassName}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      ref={ref as any}
      {...other}
    >
      <div className={classes.iconContainer}>{icon}</div>
      <div className={classes.label}>{label}</div>
    </StyledTreeItemContent>
  );
});

export default memo(TreeItemContent);
