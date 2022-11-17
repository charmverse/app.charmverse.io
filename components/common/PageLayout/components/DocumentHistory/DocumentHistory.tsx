import styled from '@emotion/styled';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { memo, useEffect, useMemo, useState } from 'react';

import { useMembers } from 'hooks/useMembers';
import type { PageMeta } from 'lib/pages';
import { getRelativeTime } from 'lib/utilities/getRelativeTime';

const StyledTypography = styled(Typography)`
  color: ${({ theme }) => theme.palette.grey[300]};
`;

function DocumentHistory ({ page }: { page: PageMeta }) {
  const updatedAtMemo = useMemo(() => getRelativeTime(new Date(page.updatedAt)), [page.updatedAt]);
  const createdAtMemo = useMemo(() => getRelativeTime(new Date(page.createdAt)), [page.createdAt]);

  const [{ updatedAt, createdAt }, setTime] = useState({ updatedAt: updatedAtMemo, createdAt: createdAtMemo });

  const { members } = useMembers();

  const createdBy = members.find(member => member.id === page.createdBy)?.username ?? 'unknown';
  const updatedBy = members.find(member => member.id === page.updatedBy)?.username ?? createdBy ?? 'unknown';

  useEffect(() => {
    setTime((prevState) => ({ ...prevState, updatedAt: updatedAtMemo }));
  }, [updatedAtMemo]);

  return (
    <Tooltip
      enterTouchDelay={0}
      enterDelay={0}
      arrow={false}
      placement='bottom-start'
      onOpen={() => setTime({ updatedAt: getRelativeTime(new Date(page.updatedAt)), createdAt: getRelativeTime(new Date(page.createdAt)) })}
      title={(
        <>
          <StyledTypography variant='caption'>Edited by</StyledTypography> {updatedBy} <StyledTypography variant='caption'>{updatedAt}</StyledTypography>
          <br />
          <StyledTypography variant='caption'>Created by</StyledTypography> {createdBy} <StyledTypography variant='caption'>{createdAt}</StyledTypography>
        </>
      )}
    >
      <Typography color='secondary' fontSize={12.8} variant='caption' fontWeight={500} marginRight='15px'>Edited {updatedAt}</Typography>
    </Tooltip>
  );
}

export default memo(DocumentHistory);
