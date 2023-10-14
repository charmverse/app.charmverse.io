import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import { useElementSize } from 'usehooks-ts';

import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import type { WorkUpsertData } from 'lib/rewards/work';
import { fontClassName } from 'theme/fonts';

import { useApplicationDialog } from '../../hooks/useApplicationDialog';

import ApplicationInput from './RewardApplicationInput';

type Props = {
  setFormInputs: (params: Partial<WorkUpsertData>) => void;
  formInputs: Partial<WorkUpsertData>;
  contentUpdated: boolean;
  setContentUpdated: (changed: boolean) => void;
};

const StyledContainer = styled(Container)`
  margin-bottom: 180px;
`;

// Note: this component is only used before a page is saved to the DB
export function NewApplication({ setFormInputs, formInputs, contentUpdated, setContentUpdated }: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { showApplication } = useApplicationDialog();
  const [, { width: containerWidth }] = useElementSize();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const [readOnlyEditor, setReadOnlyEditor] = useState(false);
  usePreventReload(contentUpdated);

  function updateContent({ doc, rawText }: ICharmEditorOutput) {
    setContentUpdated(true);
    setFormInputs({
      // applicationContent: {
      // }
      // content: JSON.stringify(doc),
      // contentText: rawText
    });
  }

  function updateSubmissiContent({ doc, rawText }: ICharmEditorOutput) {
    setContentUpdated(true);
    // setFormInputs({
    //   content: doc,
    //   contentText: rawText
    // });
  }
  return (
    <div className={`document-print-container ${fontClassName}`}>
      <StyledContainer data-test='page-charmeditor' fullWidth={isSmallScreen}>
        <Box minHeight={450}>
          <ApplicationInput onSubmit={() => null} rewardId='' />
        </Box>
      </StyledContainer>
    </div>
  );
}
