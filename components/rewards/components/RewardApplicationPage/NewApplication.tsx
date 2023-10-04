import { log } from '@charmverse/core/log';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, Stack, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { useElementSize } from 'usehooks-ts';

import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
import PageHeader, { getPageTop } from 'components/[pageId]/DocumentPage/components/PageHeader';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { ScrollableWindow } from 'components/common/PageLayout';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import type { RubricDataInput } from 'lib/proposal/rubric/upsertRubricCriteria';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import { fontClassName } from 'theme/fonts';

import type { ApplicationPropertiesInput } from '../../hooks/useApplicationDialog';
import { useApplicationDialog } from '../../hooks/useApplicationDialog';

import ApplicationInput from './RewardApplicationInput';

type Props = {
  setFormInputs: (params: Partial<ApplicationPropertiesInput>) => void;
  formInputs: ApplicationPropertiesInput;
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
    <ScrollableWindow>
      <div className={`document-print-container ${fontClassName}`}>
        <StyledContainer data-test='page-charmeditor' fullWidth={isSmallScreen}>
          <Box minHeight={450}>
            <ApplicationInput bountyId='' refreshApplication={() => null} />
          </Box>
        </StyledContainer>
      </div>
    </ScrollableWindow>
  );
}
