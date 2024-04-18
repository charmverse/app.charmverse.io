import type { Prisma } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, Divider, useMediaQuery } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useResizeObserver } from 'usehooks-ts';

import { DocumentColumn, DocumentColumnLayout } from 'components/[pageId]/DocumentPage/components/DocumentColumnLayout';
import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { PageTemplateBanner } from 'components/[pageId]/DocumentPage/components/PageTemplateBanner';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { defaultPageTop } from 'components/[pageId]/DocumentPage/DocumentPage';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import { focusEventName } from 'components/common/CharmEditor/constants';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/specRegistry';
import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { TemplateSelect } from 'components/proposals/ProposalPage/components/TemplateSelect';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePreventReload } from 'hooks/usePreventReload';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { RewardFields, RewardPropertiesField } from 'lib/rewards/blocks/interfaces';
import { fontClassName } from 'theme/fonts';

import { CustomPropertiesAdapter } from './components/RewardProperties/CustomPropertiesAdapter';
import { useNewReward } from './hooks/useNewReward';

const StyledContainer = styled(PageEditorContainer)`
  margin-bottom: 180px;
`;
// Note: this component is only used before a page is saved to the DB
export function NewRewardPage({
  isTemplate,
  templateId: templateIdFromUrl
}: {
  isTemplate?: boolean;
  templateId?: string;
}) {
  const spacePermissions = useCurrentSpacePermissions();
  const { navigateToSpacePath } = useCharmRouter();
  const { templates: rewardTemplates } = useRewardTemplates();
  const [selectedRewardTemplateId, setSelectedRewardTemplateId] = useState<null | string>();
  const [rewardTemplateId, setRewardTemplateId] = useState<null | string>();
  const [pageTitle, setPageTitle] = usePageTitle();
  const rewardPageType = isTemplate ? 'bounty_template' : 'bounty';
  const { contentUpdated, createReward, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const sourceTemplate = rewardTemplates?.find((template) => template.page.id === templateIdFromUrl);
  const [submittedDraft, setSubmittedDraft] = useState<boolean>(false);
  const containerWidthRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth = 0 } = useResizeObserver({ ref: containerWidthRef });
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const [pageData, setPageData] = useState<{
    title: string;
    content: PageContent | null;
    contentText: string;
  }>({
    title: '',
    content: null,
    contentText: ''
  });
  const canCreateReward = !spacePermissions || !!spacePermissions[0]?.createBounty;

  let disabledTooltip = '';

  if (!canCreateReward) {
    disabledTooltip = 'You do not have permission to create reward';
  }

  usePreventReload(contentUpdated);
  const templatePageOptions = (rewardTemplates || []).map((template) => ({
    id: template.page.id,
    title: template.page.title
  }));

  function focusDocumentEditor() {
    const focusEvent = new CustomEvent(focusEventName);
    // TODO: use a ref passed down instead
    document.querySelector(`.bangle-editor-core`)?.dispatchEvent(focusEvent);
  }

  function applyRewardContent({ doc, rawText }: ICharmEditorOutput) {
    setPageData({
      ...pageData,
      content: doc,
      contentText: rawText
    });
  }

  useEffect(() => {
    if (templateIdFromUrl) {
      setRewardTemplateId(templateIdFromUrl);
    }
  }, [templateIdFromUrl]);

  return (
    <Box display='flex' flexGrow={1} minHeight={0} /** add minHeight so that flexGrow expands to correct heigh */>
      <DocumentColumnLayout>
        <DocumentColumn>
          <Box display='flex' flexDirection='column' height='100%'>
            <Box
              className={`document-print-container ${fontClassName}`}
              display='flex'
              flexDirection='column'
              overflow='auto'
              flexGrow={1}
            >
              <Box ref={containerWidthRef} width='100%' />
              <PageTemplateBanner
                pageType={rewardPageType}
                isNewPage
                customTitle={canCreateReward ? undefined : 'Creating new reward is disabled'}
              />
              <StyledContainer data-test='page-charmeditor' top={defaultPageTop} fullWidth={isSmallScreen}>
                <Box minHeight={450}>
                  <PageTitleInput
                    updatedAt={new Date().toString()}
                    value={pageData.title || ''}
                    onChange={(updatedPage) => {
                      const title = updatedPage.title || '';
                      setPageData({
                        ...pageData,
                        title
                      });
                      setPageTitle(title);
                    }}
                    focusDocumentEditor={focusDocumentEditor}
                    placeholder='Title (required)'
                  />
                  <div className='focalboard-body font-family-default'>
                    <div className='CardDetail content'>
                      {!isTemplate && (
                        <>
                          <Box className='octo-propertyrow'>
                            <PropertyLabel readOnly highlighted>
                              Template
                            </PropertyLabel>
                            <Box display='flex' flex={1}>
                              <TemplateSelect
                                options={templatePageOptions}
                                value={rewardTemplateId}
                                onChange={(page) => {
                                  if (page === null) {
                                    setRewardTemplateId(null);
                                    // if user has not updated the content, then just overwrite everything
                                  } else if (pageData.contentText?.length === 0) {
                                    setRewardTemplateId(page.id);
                                  } else {
                                    setSelectedRewardTemplateId(page.id);
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                          <Divider />
                        </>
                      )}
                      <CustomPropertiesAdapter
                        reward={{
                          fields: rewardValues.fields as RewardFields
                        }}
                        onChange={(properties: RewardPropertiesField) => {
                          setRewardValues({
                            fields: { properties: properties ? { ...properties } : {} } as Prisma.JsonValue
                          });
                        }}
                      />
                    </div>
                  </div>
                  <CharmEditor
                    placeholderText={`Describe the reward. Type '/' to see the list of available commands`}
                    content={pageData.content as PageContent}
                    autoFocus={false}
                    enableVoting={false}
                    containerWidth={containerWidth}
                    pageType={rewardPageType}
                    disableNestedPages
                    onContentChange={applyRewardContent}
                    focusOnInit
                    isContentControlled
                    key={rewardTemplateId}
                  />
                </Box>
              </StyledContainer>
            </Box>
            <StickyFooterContainer>
              <Button
                data-test='publish-new-reward-button'
                disabled={Boolean(disabledTooltip) || isSavingReward}
                disabledTooltip={disabledTooltip}
                onClick={() =>
                  createReward({
                    content: pageData.contentText,
                    contentText: pageData.contentText,
                    title: pageData.title,
                    type: rewardPageType,
                    sourceTemplateId: sourceTemplate?.page.id
                  })
                }
                loading={isSavingReward && !submittedDraft}
              >
                Publish
              </Button>
            </StickyFooterContainer>
          </Box>
        </DocumentColumn>
        <ConfirmDeleteModal
          onClose={() => {
            setSelectedRewardTemplateId(null);
          }}
          open={!!selectedRewardTemplateId}
          title='Overwriting your content'
          buttonText='Overwrite'
          secondaryButtonText='Go back'
          question='Are you sure you want to overwrite your current content with the reward template content?'
          onConfirm={() => {
            setRewardTemplateId(selectedRewardTemplateId!);
            setSelectedRewardTemplateId(null);
          }}
        />
      </DocumentColumnLayout>
    </Box>
  );
}
