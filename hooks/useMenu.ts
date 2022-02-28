import React from 'react';

export function useMenu () {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  function showMenu (event: React.MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
    event.preventDefault();
    event.stopPropagation();
  }

  function hideMenu () {
    setAnchorEl(null);
  }

  return {
    showMenu,
    hideMenu,
    isOpen: Boolean(anchorEl),
    anchorEl
  };
}
