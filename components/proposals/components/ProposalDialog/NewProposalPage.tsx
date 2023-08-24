import type { Theme } from '@mui/material';
import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { useElementSize } from 'usehooks-ts';

import charmClient from 'charmClient';
import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
import PageHeader, { getPageTop } from 'components/[pageId]/DocumentPage/components/PageHeader';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { ScrollableWindow } from 'components/common/PageLayout';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSnackbar } from 'hooks/useSnackbar';
import type { RubricDataInput } from 'lib/proposal/rubric/upsertRubricCriteria';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';
import { fontClassName } from 'theme/fonts';

import type { ProposalPropertiesInput } from '../ProposalProperties/ProposalProperties';
import { ProposalProperties } from '../ProposalProperties/ProposalProperties';

import { useProposalDialog } from './hooks/useProposalDialog';

export type ProposalPageAndPropertiesInput = ProposalPropertiesInput & {
  title?: string; // title is saved to the same state that's used in ProposalPage
  content?: PageContent | null;
  contentText?: string;
  headerImage: string | null;
  icon: string | null;
};

type Props = {
  setFormInputs: (params: Partial<ProposalPageAndPropertiesInput>) => void;
  formInputs: ProposalPageAndPropertiesInput;
  contentUpdated: boolean;
  setContentUpdated: (changed: boolean) => void;
};
// Note: this component is only used before a page is saved to the DB
export function NewProposalPage({ setFormInputs, formInputs, contentUpdated, setContentUpdated }: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { showProposal } = useProposalDialog();
  const [, { width: containerWidth }] = useElementSize();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const { mutatePage } = usePages();
  const [readOnlyEditor, setReadOnlyEditor] = useState(false);
  usePreventReload(contentUpdated);

  const { proposalTemplates } = useProposalTemplates();

  const router = useRouter();

  const confirmationPopup = usePopupState({ variant: 'popover', popupId: 'create-proposal-confirmation' });

  const [isCreatingProposal, setIsCreatingProposal] = useState(false);

  const isFromTemplateSource = Boolean(formInputs.proposalTemplateId);

  useEffect(() => {
    if (currentSpace?.requireProposalTemplate) {
      setReadOnlyEditor(!formInputs.proposalTemplateId);
    }
  }, [formInputs.proposalTemplateId, currentSpace?.requireProposalTemplate]);

  const readOnlyReviewers =
    isFromTemplateSource &&
    !!proposalTemplates?.find((t) => t.id === formInputs?.proposalTemplateId && t.reviewers.length > 0);

  async function createProposal() {
    if (formInputs.categoryId && currentSpace) {
      // TODO: put validation inside the properties form component
      try {
        formInputs.rubricCriteria.forEach((criteria) => {
          if (criteria.type === 'range') {
            if (
              (!criteria.parameters.min && criteria.parameters.min !== 0) ||
              (!criteria.parameters.max && criteria.parameters.max !== 0)
            ) {
              throw new Error('Range values are invalid');
            }
            if (criteria.parameters.min >= criteria.parameters.max) {
              throw new Error('Minimum must be less than Maximum');
            }
          }
        });
      } catch (error) {
        showMessage((error as Error).message, 'error');
      }
      setIsCreatingProposal(true);
      const createdProposal = await charmClient.proposals
        .createProposal({
          authors: formInputs.authors,
          categoryId: formInputs.categoryId,
          pageProps: {
            content: formInputs.content,
            contentText: formInputs.contentText ?? '',
            title: formInputs.title,
            sourceTemplateId: formInputs.proposalTemplateId,
            headerImage: formInputs.headerImage,
            icon: formInputs.icon
          },
          evaluationType: formInputs.evaluationType,
          rubricCriteria: formInputs.rubricCriteria as RubricDataInput[],
          reviewers: formInputs.reviewers,
          spaceId: currentSpace.id
        })
        .catch((err: any) => {
          showMessage(err.message ?? 'Something went wrong', 'error');
          throw err;
        });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { proposal, ...page } = createdProposal;
      mutatePage(page);
      mutate(`/api/spaces/${currentSpace.id}/proposals`);
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
        {formInputs.headerImage && <PageBanner headerImage={formInputs.headerImage} setPage={setFormInputs} />}
        <Container top={getPageTop(formInputs)} fullWidth={isSmallScreen}>
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
                headerImage={formInputs.headerImage}
                icon={formInputs.icon}
                readOnly={false}
                updatedAt={new Date().toString()}
                title={formInputs.title || ''}
                // readOnly={readOnly || !!enableSuggestingMode}
                setPage={(updatedPage) => {
                  setFormInputs(updatedPage);
                }}
              />
              <div className='focalboard-body font-family-default'>
                <div className='CardDetail content'>
                  <ProposalProperties
                    readOnlyRubricCriteria={isFromTemplateSource}
                    readOnlyReviewers={readOnlyReviewers}
                    readOnlyProposalEvaluationType={isFromTemplateSource}
                    proposalStatus='draft'
                    proposalFormInputs={formInputs}
                    showStatus={true}
                    title=''
                    setProposalFormInputs={setFormInputs}
                    onChangeRubricCriteria={(rubricCriteria) => {
                      setFormInputs({
                        ...formInputs,
                        rubricCriteria
                      });
                    }}
                  />
                </div>
              </div>
            </CharmEditor>
          </Box>
          <Stack flexDirection='row' gap={1} justifyContent='flex-end' my={2}>
            <Button
              disabled={Boolean(disabledTooltip) || !contentUpdated || isCreatingProposal}
              disabledTooltip={disabledTooltip}
              onClick={formInputs.reviewers.length < 1 ? confirmationPopup.open : createProposal}
            >
              Create
            </Button>
            <ModalWithButtons
              open={confirmationPopup.isOpen}
              onClose={confirmationPopup.close}
              buttonText='Ok'
              onConfirm={confirmationPopup.close}
              hideCancelButton
              title='Assign a Reviewer to proceed'
            >
              <Typography>
                The chosen Reviewer will perform a final examination, ensuring the proposal is ready for the
                organization's {formInputs.evaluationType === 'vote' ? 'Vote' : 'Review'}.
              </Typography>
            </ModalWithButtons>
          </Stack>
        </Container>
      </div>
    </ScrollableWindow>
  );
}
