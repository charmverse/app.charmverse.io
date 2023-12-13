import type { PageMeta } from '@charmverse/core/pages';
import type { ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import type { PageType, ProposalEvaluationType, ProposalRubricCriteria, ProposalStatus } from '@charmverse/core/prisma';
import type { ProposalReviewerInput } from '@charmverse/core/proposals';
import { KeyboardArrowDown } from '@mui/icons-material';
import type { Theme } from '@mui/material';
import { Box, Collapse, Divider, Grid, IconButton, Stack, Switch, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef, useState } from 'react';

import { SIDEBAR_VIEWS } from 'components/[pageId]/DocumentPage/components/Sidebar/PageSidebar';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import { LoadingIcon } from 'components/common/LoadingComponent';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { CustomPropertiesAdapter } from 'components/proposals/components/ProposalProperties/CustomPropertiesAdapter';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { CreateVoteModal } from 'components/votes/components/CreateVoteModal';
import { isProdEnv } from 'config/constants';
import { usePages } from 'hooks/usePages';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { ProposalFields, ProposalPropertiesField } from 'lib/proposal/blocks/interfaces';
import type { ProposalCategory } from 'lib/proposal/interface';
import {
  getProposalStatuses,
  nextProposalStatusUpdateMessage,
  previousProposalStatusUpdateMessage
} from 'lib/proposal/proposalStatusTransition';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { useProposalCategories } from '../../hooks/useProposalCategories';

import { ProposalCategorySelect } from './components/ProposalCategorySelect';
import { ProposalEvaluationTypeSelect } from './components/ProposalEvaluationTypeSelect';
import type { RangeProposalCriteria } from './components/ProposalRubricCriteriaInput';
import { ProposalRubricCriteriaInput } from './components/ProposalRubricCriteriaInput';
import { ProposalStepper } from './components/ProposalStepper/ProposalStepper';
import { ProposalStepSummary } from './components/ProposalStepSummary';
import { ProposalTemplateSelect } from './components/ProposalTemplateSelect';

export type ProposalPropertiesInput = {
  content?: PageContent | null;
  contentText?: string; // required to know if we can overwrite content when selecting a template
  categoryId?: string | null;
  authors: string[];
  reviewers: ProposalReviewerInput[];
  proposalTemplateId?: string | null;
  evaluationType: ProposalEvaluationType;
  rubricCriteria: RangeProposalCriteria[];
  publishToLens?: boolean;
  fields: ProposalFields;
  type: PageType;
};

type ProposalPropertiesProps = {
  isPublishingToLens?: boolean;
  proposalLensLink?: string;
  archived?: boolean;
  readOnlyCategory?: boolean;
  isAdmin?: boolean;
  isFromTemplate?: boolean;
  isTemplateRequired?: boolean;
  onChangeRubricCriteria: (criteria: RangeProposalCriteria[]) => void;
  pageId?: string;
  proposalId?: string;
  proposalFlowFlags?: ProposalFlowPermissionFlags;
  proposalFormInputs: ProposalPropertiesInput;
  proposalStatus?: ProposalStatus;
  readOnlyAuthors?: boolean;
  readOnlyReviewers?: boolean;
  readOnlyProposalEvaluationType?: boolean;
  readOnlyRubricCriteria?: boolean;
  rubricAnswers?: ProposalRubricCriteriaAnswerWithTypedResponse[];
  rubricCriteria?: ProposalRubricCriteria[];
  setProposalFormInputs: (values: Partial<ProposalPropertiesInput>) => Promise<void> | void;
  isTemplate: boolean;
  snapshotProposalId?: string | null;
  updateProposalStatus?: (newStatus: ProposalStatus) => Promise<void>;
  readOnlyCustomProperties?: string[];
  openEvaluation?: () => void;
  isEvaluationSidebarOpen?: boolean;
  canSeeEvaluation?: boolean;
};

export function ProposalPropertiesBase({
  proposalLensLink,
  archived,
  isAdmin = false,
  isFromTemplate,
  isTemplateRequired,
  onChangeRubricCriteria,
  proposalFormInputs,
  pageId,
  proposalId,
  proposalFlowFlags,
  proposalStatus,
  readOnlyAuthors,
  readOnlyCategory,
  readOnlyProposalEvaluationType,
  readOnlyReviewers,
  readOnlyRubricCriteria,
  rubricAnswers = [],
  setProposalFormInputs,
  isTemplate,
  snapshotProposalId,
  updateProposalStatus,
  isPublishingToLens,
  openEvaluation,
  isEvaluationSidebarOpen,
  canSeeEvaluation,
  readOnlyCustomProperties
}: ProposalPropertiesProps) {
  const { proposalCategoriesWithCreatePermission, categories } = useProposalCategories();
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const { pages } = usePages();
  const [detailsExpanded, setDetailsExpanded] = useState(proposalStatus === 'draft');
  const prevStatusRef = useRef(proposalStatus || '');
  const [selectedProposalTemplateId, setSelectedProposalTemplateId] = useState<null | string>(null);
  const { lensProfile } = useLensProfile();
  const { proposalTemplates = [] } = useProposalTemplates();
  const isMobile = useMediaQuery<Theme>((theme) => theme.breakpoints.down('sm'));
  const { account } = useWeb3Account();
  const previousConfirmationPopup = usePopupState({
    variant: 'popover',
    popupId: 'previous-proposal-status-change-confirmation'
  });
  const nextConfirmationPopup = usePopupState({
    variant: 'popover',
    popupId: 'next-proposal-status-change-confirmation'
  });

  const statuses = getProposalStatuses(proposalFormInputs.evaluationType);
  const currentStatusIndex = proposalStatus ? statuses.indexOf(proposalStatus) : -1;
  const nextStatus = statuses[currentStatusIndex + 1];
  const previousStatus = statuses[currentStatusIndex - 1];
  const previousConfirmationMessage = previousProposalStatusUpdateMessage(previousStatus);
  const nextConfirmationMessage = nextProposalStatusUpdateMessage(nextStatus);

  async function handleProposalStatusUpdate(newStatus: ProposalStatus) {
    switch (newStatus) {
      case 'draft':
      case 'discussion':
      case 'review':
      case 'vote_active':
      case 'evaluation_active':
      case 'evaluation_closed':
      case 'reviewed':
        if (newStatus === previousStatus) {
          previousConfirmationPopup.open();
        } else if (newStatus === nextStatus) {
          nextConfirmationPopup.open();
        }
        break;
      default:
        await updateProposalStatus?.(newStatus);
        break;
    }
  }

  const proposalCategoryId = proposalFormInputs.categoryId;
  const proposalCategory = categories?.find((category) => category.id === proposalCategoryId);
  const proposalAuthorIds = proposalFormInputs.authors;
  const proposalReviewers = proposalFormInputs.reviewers;
  const isNewProposal = !pageId;
  const showStatusStepper = !isTemplate;
  const voteProposal = proposalId && proposalStatus ? { id: proposalId, status: proposalStatus } : undefined;
  const templateOptions = proposalTemplates
    .filter((_proposal) => {
      if (!proposalCategoryId) {
        return true;
      }
      return _proposal.categoryId === proposalCategoryId;
    })
    .map((template) => template.page);

  const proposalTemplatePage = proposalFormInputs.proposalTemplateId
    ? pages[proposalFormInputs.proposalTemplateId]
    : null;

  async function onChangeCategory(updatedCategory: ProposalCategory | null) {
    if (updatedCategory && updatedCategory.id !== proposalFormInputs.categoryId) {
      setProposalFormInputs({
        categoryId: updatedCategory.id,
        proposalTemplateId: null
      });
    } else if (!updatedCategory) {
      setProposalFormInputs({
        categoryId: null,
        proposalTemplateId: null
      });
    }
  }

  function applyTemplate(templatePage: PageMeta) {
    if (templatePage && templatePage.proposalId) {
      // Fetch the proposal page to get its content
      const proposalTemplate = proposalTemplates?.find(
        (_proposalTemplate) => _proposalTemplate.page.id === templatePage.id
      );
      if (proposalTemplate) {
        setProposalFormInputs({
          categoryId: proposalTemplate.categoryId,
          content: proposalTemplate.page.content as PageContent,
          contentText: proposalTemplate.page.contentText,
          reviewers: proposalTemplate.reviewers.map((reviewer) => ({
            group: reviewer.roleId ? 'role' : 'user',
            id: reviewer.roleId ?? (reviewer.userId as string)
          })),
          proposalTemplateId: templatePage.id,
          evaluationType: proposalTemplate.evaluationType,
          rubricCriteria: proposalTemplate.rubricCriteria,
          fields: (proposalTemplate.fields as ProposalFields) || {}
        });
      }
    }
  }

  function clearTemplate() {
    setProposalFormInputs({
      proposalTemplateId: null
    });
  }

  function openVoteModal() {
    setIsVoteModalOpen(true);
  }

  useEffect(() => {
    if (!prevStatusRef.current && proposalStatus === 'draft') {
      setDetailsExpanded(true);
    }

    prevStatusRef.current = proposalStatus || '';
  }, [detailsExpanded, proposalStatus]);

  let lensProposalPropertyState: 'hide' | 'show_link' | 'show_toggle' = 'hide';
  if (proposalLensLink) {
    lensProposalPropertyState = 'show_link';
  } else {
    lensProposalPropertyState = lensProfile && account ? 'show_toggle' : 'hide';
  }

  return (
    <Box
      className='CardDetail content'
      sx={{
        '.octo-propertyname .Button': {
          paddingLeft: 0
        }
      }}
      mt={2}
    >
      <div className='octo-propertylist'>
        {showStatusStepper && (
          <>
            <Grid container mb={2}>
              {!isNewProposal && (
                <ProposalStepSummary
                  archived={archived}
                  proposalFlowFlags={proposalFlowFlags}
                  proposalStatus={proposalStatus}
                  handleProposalStatusUpdate={handleProposalStatusUpdate}
                  evaluationType={proposalFormInputs.evaluationType}
                />
              )}
            </Grid>

            <Stack
              direction='row'
              gap={1}
              alignItems='center'
              sx={{ cursor: 'pointer' }}
              onClick={() => setDetailsExpanded((v) => !v)}
            >
              <Typography fontWeight='bold'>Details</Typography>
              <IconButton size='small'>
                <KeyboardArrowDown
                  fontSize='small'
                  sx={{ transform: `rotate(${detailsExpanded ? 180 : 0}deg)`, transition: 'all 0.2s ease' }}
                />
              </IconButton>
            </Stack>
          </>
        )}
        <Collapse in={detailsExpanded} timeout='auto' unmountOnExit>
          {showStatusStepper && (
            <Box mt={2} mb={2}>
              <ProposalStepper
                proposalFlowPermissions={proposalFlowFlags}
                proposalStatus={proposalStatus}
                handleProposalStatusUpdate={handleProposalStatusUpdate}
                evaluationType={proposalFormInputs.evaluationType}
              />
            </Box>
          )}

          {/* Select a category */}
          <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly required={isNewProposal} highlighted>
                Category
              </PropertyLabel>
              <Box display='flex' flex={1}>
                <ProposalCategorySelect
                  readOnly={readOnlyCategory}
                  readOnlyMessage={isFromTemplate ? templateTooltip('category', isAdmin) : undefined}
                  options={(readOnlyCategory ? categories : proposalCategoriesWithCreatePermission) || []}
                  value={proposalCategory ?? null}
                  onChange={onChangeCategory}
                />
              </Box>
            </Box>
          </Box>

          {/* Select a template */}
          {isNewProposal && proposalFormInputs.type !== 'proposal_template' && (
            <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly highlighted required={isTemplateRequired}>
                  Template
                </PropertyLabel>
                <Box display='flex' flex={1}>
                  <ProposalTemplateSelect
                    options={templateOptions}
                    value={proposalTemplatePage ?? null}
                    onChange={(template) => {
                      if (template === null) {
                        clearTemplate();
                        // if user has not updated the content, then just overwrite everything
                      } else if (proposalFormInputs.contentText?.length === 0) {
                        applyTemplate(template);
                      } else {
                        // set value to trigger a prompt
                        setSelectedProposalTemplateId(template?.id ?? null);
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* Select authors */}
          <Box justifyContent='space-between' gap={2} alignItems='center'>
            <div
              className='octo-propertyrow'
              style={{
                display: 'flex',
                height: 'fit-content',
                flexGrow: 1
              }}
            >
              <PropertyLabel readOnly required={isNewProposal} highlighted>
                Author
              </PropertyLabel>
              <Box display='flex' flex={1}>
                <UserSelect
                  memberIds={proposalAuthorIds}
                  readOnly={readOnlyAuthors}
                  onChange={(authors) => {
                    setProposalFormInputs({
                      authors
                    });
                  }}
                  wrapColumn
                  showEmptyPlaceholder
                />
              </Box>
            </div>
          </Box>
          {/* Select reviewers */}
          <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly required={isNewProposal} highlighted>
                Reviewer
              </PropertyLabel>
              <UserAndRoleSelect
                data-test='proposal-reviewer-select'
                readOnlyMessage={isFromTemplate ? templateTooltip('reviewers', isAdmin) : undefined}
                readOnly={readOnlyReviewers}
                value={proposalReviewers}
                proposalCategoryId={proposalFormInputs.categoryId}
                onChange={async (options) => {
                  const reviewerOptions = options.filter(
                    (option) => option.group === 'role' || option.group === 'user'
                  ) as ProposalReviewerInput[];
                  await setProposalFormInputs({
                    reviewers: reviewerOptions.map((option) => ({ group: option.group, id: option.id }))
                  });
                }}
              />
            </Box>
          </Box>

          {lensProposalPropertyState !== 'hide' && (
            <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
              <Box
                display='flex'
                height='fit-content'
                flex={1}
                className='octo-propertyrow'
                // override align-items flex-start with inline style
                style={{
                  alignItems: 'center'
                }}
              >
                {lensProposalPropertyState === 'show_link' ? (
                  <>
                    <PropertyLabel readOnly highlighted>
                      Lens Post
                    </PropertyLabel>
                    <Link
                      href={`https://${!isProdEnv ? 'testnet.' : ''}hey.xyz/posts/${proposalLensLink}`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <Typography variant='body2' color='primary'>
                        View on lens
                      </Typography>
                    </Link>
                  </>
                ) : (
                  <>
                    <PropertyLabel readOnly highlighted>
                      Publish to Lens
                    </PropertyLabel>
                    {isPublishingToLens ? (
                      <LoadingIcon size={16} />
                    ) : (
                      <Switch
                        disabled={proposalStatus !== 'draft'}
                        checked={proposalFormInputs.publishToLens ?? false}
                        onChange={(e) => {
                          setProposalFormInputs({
                            publishToLens: e.target.checked
                          });
                        }}
                      />
                    )}
                    {proposalFormInputs.publishToLens && proposalStatus !== 'draft' && !isPublishingToLens && (
                      <Typography variant='body2' color='error'>
                        Failed publishing to Lens
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            </Box>
          )}

          {/* Select valuation type */}
          <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Type
              </PropertyLabel>
              <ProposalEvaluationTypeSelect
                readOnly={readOnlyProposalEvaluationType}
                readOnlyMessage={isFromTemplate ? templateTooltip('evaluation type', isAdmin) : undefined}
                value={proposalFormInputs.evaluationType}
                onChange={(evaluationType) => {
                  setProposalFormInputs({
                    evaluationType
                  });
                }}
              />
            </Box>
          </Box>

          {/* Select rubric criteria */}

          {proposalFormInputs.evaluationType === 'rubric' && (
            <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
              <Box
                display='flex'
                height='fit-content'
                flex={1}
                className='octo-propertyrow'
                flexDirection={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretch!important', sm: 'flex-start' }}
              >
                {isMobile ? (
                  <Typography variant='caption' component='div' color='secondary' fontWeight='600' p='4px 8px' mb={1}>
                    Rubric criteria
                  </Typography>
                ) : (
                  <PropertyLabel readOnly highlighted>
                    &nbsp;
                  </PropertyLabel>
                )}
                <Box display='flex' flex={1} flexDirection='column'>
                  <ProposalRubricCriteriaInput
                    readOnly={readOnlyRubricCriteria}
                    readOnlyMessage={isFromTemplate ? templateTooltip('rubric criteria', isAdmin) : undefined}
                    value={proposalFormInputs.rubricCriteria}
                    onChange={onChangeRubricCriteria}
                    proposalStatus={proposalStatus}
                    answers={rubricAnswers ?? []}
                  />
                </Box>
              </Box>
            </Box>
          )}

          <CustomPropertiesAdapter
            readOnly={readOnlyAuthors}
            readOnlyProperties={readOnlyCustomProperties}
            proposal={proposalFormInputs}
            onChange={(properties: ProposalPropertiesField) => {
              setProposalFormInputs({
                fields: { properties: properties ? { ...properties } : {} }
              });
            }}
          />
        </Collapse>
        <Divider
          sx={{
            my: 2
          }}
        />

        {canSeeEvaluation && (
          <Box display='flex' justifyContent='center' py={2}>
            <Button
              disabled={isEvaluationSidebarOpen}
              startIcon={SIDEBAR_VIEWS.proposal_evaluation.icon}
              onClick={openEvaluation}
            >
              Open evaluation
            </Button>
          </Box>
        )}

        <ConfirmDeleteModal
          onClose={() => {
            setSelectedProposalTemplateId(null);
          }}
          open={!!selectedProposalTemplateId}
          title='Overwriting your content'
          buttonText='Overwrite'
          secondaryButtonText='Go back'
          question='Are you sure you want to overwrite your current content with the proposal template content?'
          onConfirm={() => {
            const templatePage = templateOptions.find((template) => template.id === selectedProposalTemplateId);
            if (templatePage) {
              applyTemplate(templatePage);
            }
            setSelectedProposalTemplateId(null);
          }}
        />
        <CreateVoteModal
          proposalFlowFlags={proposalFlowFlags}
          proposal={voteProposal}
          pageId={pageId}
          snapshotProposalId={snapshotProposalId || null}
          open={isVoteModalOpen}
          onCreateVote={() => {
            setIsVoteModalOpen(false);
            updateProposalStatus?.('vote_active');
          }}
          onPublishToSnapshot={() => {
            setIsVoteModalOpen(false);
            updateProposalStatus?.('vote_active');
          }}
          onClose={() => {
            setIsVoteModalOpen?.(false);
          }}
        />
      </div>
      <ModalWithButtons
        open={previousConfirmationPopup.isOpen && !!previousConfirmationMessage}
        buttonText='Continue'
        onClose={previousConfirmationPopup.close}
        onConfirm={() => updateProposalStatus?.(previousStatus)}
      >
        <Typography>{previousConfirmationMessage}</Typography>
      </ModalWithButtons>
      <ModalWithButtons
        open={nextConfirmationPopup.isOpen && !!nextConfirmationMessage}
        onClose={nextConfirmationPopup.close}
        buttonText='Continue'
        onConfirm={() => {
          if (nextStatus === 'vote_active') {
            openVoteModal?.();
          } else {
            updateProposalStatus?.(nextStatus);
          }
        }}
      >
        <Typography>{nextConfirmationMessage}</Typography>
      </ModalWithButtons>
    </Box>
  );
}

function templateTooltip(fieldName: string, isAdmin: boolean) {
  return isAdmin
    ? `Only admins can override ${fieldName} when using a template`
    : `Cannot change ${fieldName} when using template`;
}
