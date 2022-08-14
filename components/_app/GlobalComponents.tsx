import React from 'react';
import { Snackbar } from '@mui/material';
import HexagonalAvatarMask from 'components/common/HexagonalAvatarMask';
import SetAvatarPopup from 'components/profile/components/SetAvatarPopup/SetAvatarPopup';

export default function GlobalComponents () {
  return (
    <>
      <HexagonalAvatarMask id='hexagon-avatar' />
      <SetAvatarPopup />
      <Snackbar />
    </>
  );
}
