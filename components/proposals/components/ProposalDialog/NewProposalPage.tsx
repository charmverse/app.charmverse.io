import type { PageType } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';
import { useElementSize } from 'usehooks-ts';

import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
import PageHeader, { getPageTop } from 'components/[pageId]/DocumentPage/components/PageHeader';
import { PageTemplateBanner } from 'components/[pageId]/DocumentPage/components/PageTemplateBanner';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { fontClassName } from 'theme/fonts';

import type { ProposalPropertiesInput } from '../ProposalProperties/ProposalProperties';
import { ProposalProperties } from '../ProposalProperties/ProposalProperties';

export type ProposalPageAndPropertiesInput = ProposalPropertiesInput & {
  title?: string; // title is saved to the same state that's used in ProposalPage
  content?: PageContent | null;
  contentText?: string;
  headerImage: string | null;
  icon: string | null;
  type: Extract<PageType, 'proposal' | 'proposal_template'>;
};

type Props = {
  setFormInputs: (params: Partial<ProposalPageAndPropertiesInput>) => void;
  formInputs: ProposalPageAndPropertiesInput;
  contentUpdated: boolean;
};

const StyledContainer = styled(Container)`
  margin-bottom: 180px;
`;

// Note: this component is only used before a page is saved to the DB
export function NewProposalPage({ setFormInputs, formInputs, contentUpdated }: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const [, { width: containerWidth }] = useElementSize();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const [readOnlyEditor, setReadOnlyEditor] = useState(false);
  const isAdmin = useIsAdmin();

  usePreventReload(contentUpdated);

  const { proposalTemplates } = useProposalTemplates();

  const isFromTemplateSource = Boolean(formInputs.proposalTemplateId);

  useEffect(() => {
    if (currentSpace?.requireProposalTemplate) {
      setReadOnlyEditor(!formInputs.proposalTemplateId);
    }
  }, [formInputs.proposalTemplateId, currentSpace?.requireProposalTemplate]);

  const readOnlyReviewers = !!proposalTemplates?.some(
    (t) => t.id === formInputs?.proposalTemplateId && t.reviewers.length > 0
  );

  const sourceTemplate = isFromTemplateSource
    ? proposalTemplates?.find((template) => template.id === formInputs.proposalTemplateId)
    : undefined;

  // properties with values from templates should be read only
  const readOnlyCustomProperties =
    !isAdmin && sourceTemplate?.fields
      ? Object.entries((sourceTemplate?.fields as ProposalFields).properties)?.reduce((acc, [key, value]) => {
          if (!value) {
            return acc;
          }

          acc.push(key);
          return acc;
        }, [] as string[])
      : [];

  function updateProposalContent({ doc, rawText }: ICharmEditorOutput) {
    setFormInputs({
      content: doc,
      contentText: rawText
    });
  }

  return (
    <div className={`document-print-container ${fontClassName}`}>
      <Box display='flex' flexDirection='column'>
        <PageTemplateBanner pageType={formInputs.type} isNewPage />
        {formInputs.headerImage && <PageBanner headerImage={formInputs.headerImage} setPage={setFormInputs} />}
        <StyledContainer data-test='page-charmeditor' top={getPageTop(formInputs)} fullWidth={isSmallScreen}>
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
                placeholder='Title (required)'
              />
              <div className='focalboard-body font-family-default'>
                <div className='CardDetail content'>
                  <ProposalProperties
                    isFromTemplate={isFromTemplateSource}
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
                    readOnlyCustomProperties={readOnlyCustomProperties}
                  />
                </div>
              </div>
            </CharmEditor>
          </Box>
        </StyledContainer>
      </Box>
    </div>
  );
}
