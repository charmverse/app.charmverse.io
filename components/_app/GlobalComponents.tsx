import React from 'react';
import { Snackbar } from '@mui/material';
import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';

export default function GlobalComponents () {
  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      <Snackbar />
    </>
  );
}
