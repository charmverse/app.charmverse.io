import type { Proposal } from '@charmverse/core/prisma';
import { Box, Collapse, Divider, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { InputSearchMemberBase } from 'components/common/form/InputSearchMember';
import { InputSearchReviewers } from 'components/common/form/InputSearchReviewers';
import ProposalCategoryInput from 'components/proposals/components/ProposalCategoryInput';
import ProposalTemplateInput from 'components/proposals/components/ProposalTemplateInput';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useRoles } from 'hooks/useRoles';
import { useUser } from 'hooks/useUser';
import type { Member } from 'lib/members/interfaces';
import type { PageMeta } from 'lib/pages';
import type { ProposalCategory } from 'lib/proposal/interface';
import type { ProposalUserGroup } from 'lib/proposal/proposalStatusTransition';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

import type { ProposalFormInputs } from '../interfaces';

interface ProposalPropertiesProps {
  readOnly?: boolean;
  isTemplate: boolean;
  proposalFormInputs: ProposalFormInputs;
  setProposalFormInputs: (params: Partial<ProposalFormInputs>) => void;
}

export function ProposalDialogProperties({
  setProposalFormInputs,
  proposalFormInputs,
  readOnly,
  isTemplate
}: ProposalPropertiesProps) {
  const { categories } = useProposalCategories();

  const { pages } = usePages();
  const currentSpace = useCurrentSpace();

  const { members } = useMembers();
  const { roles = [] } = useRoles();
  const { user } = useUser();
  const [proposalTemplates, setProposalTemplates] = useState<PageMeta[]>([]);
  const { data: proposals = [] } = useSWR(
    () => (currentSpace ? `proposals/${currentSpace.id}` : null),
    () => charmClient.proposals.getProposalsBySpace({ spaceId: currentSpace!.id })
  );
  const proposalsRecord = proposals.reduce((acc, _proposal) => {
    acc[_proposal.id] = _proposal;
    return acc;
  }, {} as Record<string, Proposal>);

  const proposalCategoryId = proposalFormInputs.categoryId;
  const proposalCategory = categories?.find((category) => category.id === proposalCategoryId);
  const proposalAuthorIds = proposalFormInputs.authors;
  const proposalReviewers = proposalFormInputs.reviewers;
  const isProposalAuthor = user && proposalAuthorIds.some((authorId) => authorId === user.id);

  const proposalTemplatePage = proposalFormInputs.proposalTemplateId
    ? pages[proposalFormInputs.proposalTemplateId]
    : null;

  useEffect(() => {
    if (pages) {
      setProposalTemplates(Object.values(pages).filter((p) => p?.type === 'proposal_template') as PageMeta[]);
    }
  }, [pages, proposals]);

  async function selectProposalTemplate(templatePage: PageMeta | null) {
    if (templatePage && templatePage.proposalId) {
      // Fetch the proposal page to get its content
      const fetchedProposalTemplatePage = await charmClient.pages.getPage(templatePage.id);
      const proposalTemplate = await charmClient.proposals.getProposal(templatePage.proposalId);
      if (fetchedProposalTemplatePage) {
        setProposalFormInputs({
          ...proposalFormInputs,
          content: fetchedProposalTemplatePage.content as PageContent,
          contentText: fetchedProposalTemplatePage.contentText,
          reviewers: proposalTemplate.reviewers.map((reviewer) => ({
            group: reviewer.roleId ? 'role' : 'user',
            id: reviewer.roleId ?? (reviewer.userId as string)
          })),
          proposalTemplateId: templatePage.id
        });
      }
    }
  }

  const isProposalReviewer =
    user &&
    proposalReviewers.some((reviewer) => {
      if (reviewer.group === 'user') {
        return reviewer.id === user.id;
      }
      return user.spaceRoles.some((spaceRole) =>
        spaceRole.spaceRoleToRole.some(({ roleId }) => roleId === reviewer.id)
      );
    });

  const reviewerOptionsRecord: Record<
    string,
    ({ group: 'role' } & ListSpaceRolesResponse) | ({ group: 'user' } & Member)
  > = {};

  const currentUserGroups: ProposalUserGroup[] = [];
  if (isProposalAuthor) {
    currentUserGroups.push('author');
  }

  if (isProposalReviewer) {
    currentUserGroups.push('reviewer');
  }

  members.forEach((member) => {
    reviewerOptionsRecord[member.id] = {
      ...member,
      group: 'user'
    };
  });

  (roles ?? []).forEach((role) => {
    reviewerOptionsRecord[role.id] = {
      ...role,
      group: 'role'
    };
  });

  async function onChangeCategory(updatedCategory: ProposalCategory | null) {
    if (updatedCategory) {
      setProposalFormInputs({
        ...proposalFormInputs,
        categoryId: updatedCategory.id
      });
    }
  }

  return (
    <Box
      className='octo-propertylist'
      sx={{
        '& .MuiInputBase-input': {
          background: 'none'
        }
      }}
      mt={2}
    >
      <Collapse in timeout='auto' unmountOnExit>
        <Grid container mb={2}>
          <Grid item xs={8}>
            <Box display='flex' gap={1} alignItems='center'>
              <Typography fontWeight='bold'>Proposal information</Typography>
            </Box>
          </Grid>
        </Grid>

        <Box justifyContent='space-between' gap={2} alignItems='center' my='6px'>
          <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
            <div className='octo-propertyname octo-propertyname--readonly'>
              <Button>Category</Button>
            </div>
            <Box display='flex' flex={1}>
              <ProposalCategoryInput
                options={categories || []}
                value={proposalCategory ?? null}
                onChange={onChangeCategory}
              />
            </Box>
          </Box>
        </Box>

        {!isTemplate && (
          <Box justifyContent='space-between' gap={2} alignItems='center' my='6px'>
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <div className='octo-propertyname octo-propertyname--readonly'>
                <Button>Template</Button>
              </div>
              <Box display='flex' flex={1}>
                <ProposalTemplateInput
                  options={
                    proposalTemplates.filter((proposalTemplate) => {
                      if (!proposalTemplate.proposalId) {
                        return false;
                      }

                      const _proposal = proposalsRecord[proposalTemplate.proposalId];
                      if (!_proposal) {
                        return false;
                      }

                      return _proposal.categoryId === proposalCategory?.id;
                    }) || []
                  }
                  value={proposalTemplatePage ?? null}
                  onChange={(page) => {
                    selectProposalTemplate(page);
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}

        <Box justifyContent='space-between' gap={2} alignItems='center'>
          <div
            className='octo-propertyrow'
            style={{
              display: 'flex',
              height: 'fit-content',
              flexGrow: 1
            }}
          >
            <div className='octo-propertyname octo-propertyname--readonly'>
              <Button>Author</Button>
            </div>
            <div style={{ width: '100%' }}>
              <InputSearchMemberBase
                filterSelectedOptions
                multiple
                placeholder='Select authors'
                value={members.filter((member) => proposalAuthorIds.find((authorId) => member.id === authorId))}
                disableCloseOnSelect
                onChange={async (_, _members) => {
                  // Must have atleast one author of proposal
                  if ((_members as Member[]).length !== 0) {
                    setProposalFormInputs({
                      ...proposalFormInputs,
                      authors: (_members as Member[]).map((member) => member.id)
                    });
                  }
                }}
                disabled={readOnly}
                readOnly={readOnly}
                options={members}
                sx={{
                  width: '100%'
                }}
              />
            </div>
          </div>
        </Box>
        <Box justifyContent='space-between' gap={2} alignItems='center'>
          <div
            className='octo-propertyrow'
            style={{
              display: 'flex',
              height: 'fit-content',
              flexGrow: 1
            }}
          >
            <div className='octo-propertyname octo-propertyname--readonly'>
              <Button>Reviewer</Button>
            </div>
            <div style={{ width: '100%' }}>
              <InputSearchReviewers
                disabled={readOnly}
                readOnly={readOnly}
                value={proposalReviewers.map((reviewer) => reviewerOptionsRecord[reviewer.id])}
                disableCloseOnSelect={true}
                excludedIds={proposalReviewers.map((reviewer) => reviewer.id)}
                onChange={async (e, options) => {
                  setProposalFormInputs({
                    ...proposalFormInputs,
                    reviewers: options.map((option) => ({ group: option.group, id: option.id }))
                  });
                }}
                sx={{
                  width: '100%'
                }}
              />
            </div>
          </div>
        </Box>
      </Collapse>

      <Divider
        sx={{
          my: 2
        }}
      />
    </Box>
  );
}
