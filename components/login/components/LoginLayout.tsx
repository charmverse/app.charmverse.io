import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Image from 'components/common/Image';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import type { ErrorType } from 'lib/utilities/errors';
import splashImage from 'public/images/artwork/world.png';

export const Container = styled(Box)`
  max-width: 100%;
  width: 1170px;
  margin: 0 auto;
`;
