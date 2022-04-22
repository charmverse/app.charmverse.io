
import { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Menu } from '@mui/material';
import { BaseEmoji, Picker } from 'emoji-mart';
import { MouseEvent, ReactNode, useState } from 'react';

export default function Disclosure ({ children, node, updateAttrs }: NodeViewProps & { children: ReactNode }) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (children);
}
