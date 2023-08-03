import type { Theme } from '@mui/material';
import { Box, Stack, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { useElementSize } from 'usehooks-ts';

import charmClient from 'charmClient';
import PageHeader from 'components/[pageId]/DocumentPage/components/PageHeader';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { ScrollableWindow } from 'components/common/PageLayout';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import { fontClassName } from 'theme/fonts';

import type { ProposalFormInputs } from '../ProposalProperties/ProposalProperties';
import { ProposalProperties } from '../ProposalProperties/ProposalProperties';

import { useProposalDialog } from './hooks/useProposalDialog';

type Props = {
  setFormInputs: (params: Partial<ProposalFormInputs>) => void;
  formInputs: ProposalFormInputs;
  contentUpdated: boolean;
  setContentUpdated: (changed: boolean) => void;
};
// Note: this component is only used before a page is saved to the DB
export function ProposalPage({ setFormInputs, formInputs, contentUpdated, setContentUpdated }: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { showProposal } = useProposalDialog();
  const [_, { width: containerWidth }] = useElementSize();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const { mutatePage } = usePages();
  const [readOnlyEditor, setReadOnlyEditor] = useState(false);
  usePreventReload(contentUpdated);
  const router = useRouter();
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);

  useEffect(() => {
    if (currentSpace?.requireProposalTemplate) {
      setReadOnlyEditor(!formInputs.proposalTemplateId);
    }
  }, [formInputs.proposalTemplateId, currentSpace?.requireProposalTemplate]);

  async function createProposal() {
    if (formInputs.categoryId && currentSpace) {
      setIsCreatingProposal(true);
      const createdProposal = await charmClient.proposals
        .createProposal({
          authors: formInputs.authors,
          categoryId: formInputs.categoryId,
          pageProps: {
            content: formInputs.content,
            contentText: formInputs.contentText ?? '',
            title: formInputs.title
          },
          reviewers: formInputs.reviewers,
          spaceId: currentSpace.id
        })
        .catch((err: any) => {
          showMessage(err.message ?? 'Something went wrong', 'error');
          throw err;
        });

      const { proposal, ...page } = createdProposal;
      mutatePage(page);
      mutate(`proposals/${currentSpace.id}`);
      showProposal({
        pageId: page.id,
        onClose() {
          setUrlWithoutRerender(router.pathname, { id: null });
        }
      });
      setUrlWithoutRerender(router.pathname, { id: page.id });
      setContentUpdated(false);
      setIsCreatingProposal(false);
    }
  }

  function updateProposalContent({ doc, rawText }: ICharmEditorOutput) {
    setContentUpdated(true);
    setFormInputs({
      content: doc,
      contentText: rawText
    });
  }

  let disabledTooltip = '';
  if (!formInputs.title) {
    disabledTooltip = 'Title is required';
  } else if (checkIsContentEmpty(formInputs.content)) {
    disabledTooltip = 'Content is required';
  } else if (!formInputs.categoryId) {
    disabledTooltip = 'Category is required';
  } else if (currentSpace?.requireProposalTemplate && !formInputs.proposalTemplateId) {
    disabledTooltip = 'Template is required';
  }

  return (
    <ScrollableWindow>
      <div className={`document-print-container ${fontClassName}`}>
        <Container top={50} fullWidth={isSmallScreen}>
          <Box minHeight={450}>
            <CharmEditor
              placeholderText={
                readOnlyEditor
                  ? `You must select a proposal template to begin writing`
                  : `Describe the proposal. Type '/' to see the list of available commands`
              }
              content={formInputs.content as PageContent}
              autoFocus={false}
              style={{
                color: readOnlyEditor ? `var(--secondary-text)` : 'inherit'
              }}
              enableVoting={false}
              containerWidth={containerWidth}
              pageType='proposal'
              disableNestedPages
              onContentChange={updateProposalContent}
              focusOnInit
              isContentControlled
              insideModal
              readOnly={readOnlyEditor}
              key={`${String(formInputs.proposalTemplateId)}.${readOnlyEditor}`}
            >
              {/* temporary? disable editing of page title when in suggestion mode */}
              <PageHeader
                headerImage={null}
                icon={null}
                readOnly={false}
                updatedAt={new Date().toString()}
                title={formInputs.title || ''}
                // readOnly={readOnly || !!enableSuggestingMode}
                setPage={(updatedPage) => {
                  setFormInputs({
                    title: updatedPage.title
                  });
                }}
              />
              <div className='focalboard-body font-family-default'>
                <div className='CardDetail content'>
                  <ProposalProperties
                    isTemplate={false}
                    proposalStatus='draft'
                    proposalFormInputs={formInputs}
                    setProposalFormInputs={setFormInputs}
                  />
                </div>
              </div>
            </CharmEditor>
          </Box>
          <Stack flexDirection='row' gap={1} justifyContent='flex-end' my={2}>
            <Button
              disabled={Boolean(disabledTooltip) || !contentUpdated || isCreatingProposal}
              disabledTooltip={disabledTooltip}
              onClick={createProposal}
            >
              Create
            </Button>
          </Stack>
        </Container>
      </div>
    </ScrollableWindow>
  );
}
