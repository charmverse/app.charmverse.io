import styled from '@emotion/styled';
import type { SxProps, TypographyProps } from '@mui/material';
import { Divider, Stack, Typography } from '@mui/material';

const StyledTitleTypography = styled(Typography)`
  font-weight: bold;
  margin-bottom: ${({ theme }) => theme.spacing(0.5)}px;
`;

export function SelectedPropertiesList({
  items,
  title,
  children,
  hideDivider,
  itemsSx,
  titleVariant = 'body1'
}: {
  title: string;
  children?: React.ReactNode;
  items: string[];
  hideDivider?: boolean;
  itemsSx?: SxProps;
  titleVariant?: TypographyProps['variant'];
}) {
  return (
    <Stack>
      <StyledTitleTypography variant={titleVariant}>{title}</StyledTitleTypography>
      <Stack
        gap={0.5}
        mt={0.5}
        sx={{
          ...itemsSx
        }}
      >
        {items.map((item) => {
          return (
            <Typography fontWeight={500} color='secondary' variant='subtitle1' key={item}>
              {item}
            </Typography>
          );
        })}
        {children}
      </Stack>
      {!hideDivider && (
        <Divider
          sx={{
            my: 2
          }}
        />
      )}
    </Stack>
  );
}
