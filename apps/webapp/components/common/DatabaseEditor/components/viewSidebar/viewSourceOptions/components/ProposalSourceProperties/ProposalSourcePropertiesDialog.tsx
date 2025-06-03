import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import { Dialog, Divider, IconButton, ListItemIcon, ListItemText, MenuItem, Stack, Typography } from '@mui/material';
import { defaultProposalPropertyTypes } from '@packages/databases/proposalDbProperties';
import type { SelectedProposalProperties } from '@packages/databases/proposalsSource/interfaces';
import { useMemo, useState } from 'react';

import { Button } from 'components/common/Button';
import MultiTabs from 'components/common/MultiTabs';
import { SectionName } from 'components/common/PageLayout/components/Sidebar/components/SectionName';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useSmallScreen } from 'hooks/useMediaScreens';

import { CustomPropertiesList, CustomPropertiesReadonlyList } from './CustomPropertiesList';
import { FormFieldPropertiesList } from './FormFieldPropertiesList';
import { ProjectProfilePropertiesList, ProjectProfilePropertiesReadonlyList } from './ProjectProfilePropertiesList';
import { ProposalDefaultPropertiesList, ProposalDefaultPropertiesReadonlyList } from './ProposalDefaultPropertiesList';
import { RubricEvaluationPropertiesList } from './RubricEvaluationPropertiesList';
import { TemplatePropertiesReadonlyList } from './TemplatePropertiesReadonlyList';

type SelectedGroup =
  | {
      group: 'projectProfile';
    }
  | {
      group: 'templateProperties';
      pageId: string;
    }
  | {
      group: 'customProperties';
    }
  | {
      group: 'proposalDefaults';
    };

function ProposalSourcePropertiesGroup({
  setSelectedGroup,
  selectedGroup
}: {
  setSelectedGroup: (selectedGroup: SelectedGroup) => void;
  selectedGroup: SelectedGroup;
}) {
  const { proposalTemplates } = useProposalTemplates({
    detailed: true
  });

  const proposalTemplatePages = useMemo(() => {
    return (proposalTemplates || [])
      .filter(
        (proposal) =>
          !proposal.archived &&
          !proposal.draft &&
          ((proposal.formFields &&
            proposal.formFields.filter(
              (formField) => formField.type !== 'project_profile' && formField.type !== 'label'
            ).length > 0) ||
            (proposal.evaluations?.length && proposal.evaluations.some((evaluation) => evaluation.type === 'rubric')))
      )
      .map((proposal) => ({
        pageId: proposal.pageId,
        title: proposal.title,
        proposalId: proposal.proposalId,
        isStructuredProposal: proposal.contentType === 'structured'
      }));
  }, [proposalTemplates]);

  return (
    <>
      <SectionName>Groups</SectionName>
      <Stack>
        <MenuItem
          dense
          selected={selectedGroup.group === 'proposalDefaults'}
          onClick={() => {
            setSelectedGroup({
              group: 'proposalDefaults'
            });
          }}
        >
          <ListItemText>Proposal Defaults</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          selected={selectedGroup.group === 'projectProfile'}
          onClick={() => {
            setSelectedGroup({
              group: 'projectProfile'
            });
          }}
        >
          <ListItemText>Project Profile</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          selected={selectedGroup.group === 'customProperties'}
          onClick={() => {
            setSelectedGroup({
              group: 'customProperties'
            });
          }}
        >
          <ListItemText>Custom Properties</ListItemText>
        </MenuItem>
      </Stack>
      <SectionName>Templates</SectionName>
      <Stack>
        {proposalTemplatePages.length ? (
          proposalTemplatePages.map((template) => (
            <MenuItem
              key={template.pageId}
              dense
              selected={selectedGroup.group === 'templateProperties' && selectedGroup.pageId === template.pageId}
              onClick={() => {
                setSelectedGroup({
                  group: 'templateProperties',
                  pageId: template.pageId
                });
              }}
            >
              <ListItemIcon>
                {template.isStructuredProposal ? <WidgetsOutlinedIcon /> : <DescriptionOutlinedIcon />}
              </ListItemIcon>
              <ListItemText
                sx={{
                  'white-space': 'break-spaces'
                }}
              >
                {template.title || 'Untitled'}
              </ListItemText>
            </MenuItem>
          ))
        ) : (
          <Typography pl={2} variant='caption'>
            No proposal templates
          </Typography>
        )}
      </Stack>
    </>
  );
}

function ProposalSourcePropertiesSelector({
  selectedGroup,
  selectedProperties,
  setSelectedProperties
}: {
  selectedGroup: SelectedGroup;
  selectedProperties: SelectedProposalProperties;
  setSelectedProperties: (selectedProperties: SelectedProposalProperties) => void;
}) {
  return (
    <>
      {selectedGroup.group === 'proposalDefaults' && (
        <>
          <Typography variant='h6'>Proposal Defaults</Typography>
          <ProposalDefaultPropertiesList
            selectedProperties={selectedProperties}
            setSelectedProperties={setSelectedProperties}
          />
        </>
      )}
      {selectedGroup?.group === 'projectProfile' && (
        <>
          <Typography variant='h6'>Project profile properties</Typography>
          <ProjectProfilePropertiesList
            selectedProperties={selectedProperties}
            setSelectedProperties={setSelectedProperties}
          />
        </>
      )}
      {selectedGroup.group === 'customProperties' && (
        <>
          <Typography variant='h6'>Custom properties</Typography>
          <CustomPropertiesList selectedProperties={selectedProperties} setSelectedProperties={setSelectedProperties} />
        </>
      )}
      {selectedGroup.group === 'templateProperties' && (
        <>
          <Typography variant='h6'>Template properties</Typography>
          <Stack gap={1}>
            <Typography fontWeight='bold'>Rubric evaluation properties</Typography>
            <RubricEvaluationPropertiesList
              selectedProperties={selectedProperties}
              setSelectedProperties={setSelectedProperties}
              templateId={selectedGroup.pageId}
            />
          </Stack>
          <Divider
            sx={{
              my: 1
            }}
          />
          <Stack gap={1}>
            <Typography fontWeight='bold'>Form field properties</Typography>
            <FormFieldPropertiesList
              templateId={selectedGroup.pageId}
              selectedProperties={selectedProperties}
              setSelectedProperties={setSelectedProperties}
            />
          </Stack>
        </>
      )}
    </>
  );
}

function ProposalSourcePropertiesList({
  selectedProperties,
  onApply
}: {
  selectedProperties: SelectedProposalProperties;
  onApply: (selectedProperties: SelectedProposalProperties) => Promise<void>;
}) {
  const [isApplying, setIsApplying] = useState(false);
  const isSmallScreen = useSmallScreen();

  const noPropertiesSelected =
    selectedProperties.project.length === 0 &&
    selectedProperties.projectMember.length === 0 &&
    selectedProperties.templateProperties.length === 0 &&
    selectedProperties.customProperties.length === 0 &&
    selectedProperties.defaults.length === 0;

  return (
    <>
      <Stack
        sx={{
          overflow: 'auto',
          height: isSmallScreen ? '95%' : '80vh'
        }}
      >
        <SectionName>Selected Properties</SectionName>
        <Stack p={2}>
          <ProposalDefaultPropertiesReadonlyList selectedProperties={selectedProperties} />
          <ProjectProfilePropertiesReadonlyList selectedProperties={selectedProperties} />
          <TemplatePropertiesReadonlyList selectedProperties={selectedProperties} />
          <CustomPropertiesReadonlyList selectedProperties={selectedProperties} />
          {noPropertiesSelected && <Typography variant='caption'>No properties selected</Typography>}
        </Stack>
      </Stack>
      <Button
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16
        }}
        onClick={() => {
          setIsApplying(true);
          onApply(selectedProperties).finally(() => {
            setIsApplying(false);
          });
        }}
        loading={isApplying}
        disabled={noPropertiesSelected}
        data-test='apply-proposal-source-properties'
        disabledTooltip='Please select at least one property'
      >
        Apply
      </Button>
    </>
  );
}

export function ProposalSourcePropertiesDialog({
  onClose,
  onApply,
  initialSelectedProperties
}: {
  initialSelectedProperties?: Partial<SelectedProposalProperties>;
  onApply: (selectedProperties: SelectedProposalProperties) => Promise<void>;
  onClose: VoidFunction;
}) {
  const [selectedProperties, setSelectedProperties] = useState<SelectedProposalProperties>({
    projectMember: [],
    project: [],
    defaults: [...defaultProposalPropertyTypes],
    templateProperties: [],
    customProperties: [],
    ...initialSelectedProperties
  });
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup>({
    group: 'proposalDefaults'
  });

  const isMobile = useSmallScreen();

  if (isMobile) {
    return (
      <Dialog fullWidth maxWidth='lg' fullScreen open onClose={onClose}>
        <Stack direction='row' height='100%'>
          <Stack width='60%' gap={1}>
            <MultiTabs
              tabs={[
                [
                  'Groups',
                  <Stack key='groups' gap={1} height='90vh' overflow='auto'>
                    <ProposalSourcePropertiesGroup setSelectedGroup={setSelectedGroup} selectedGroup={selectedGroup} />
                  </Stack>
                ],
                [
                  'Properties',
                  <Stack key='properties' gap={1} height='90vh' overflow='auto' pr={1}>
                    <ProposalSourcePropertiesSelector
                      selectedGroup={selectedGroup}
                      selectedProperties={selectedProperties}
                      setSelectedProperties={setSelectedProperties}
                    />
                  </Stack>
                ]
              ]}
            />
          </Stack>
          <Stack
            sx={{
              pt: 3,
              width: '40%',
              backgroundColor: (theme) => theme.palette.sidebar.background
            }}
          >
            <ProposalSourcePropertiesList selectedProperties={selectedProperties} onApply={onApply} />
          </Stack>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 15,
              top: 15,
              zIndex: 1
            }}
          >
            <CloseIcon color='secondary' fontSize='small' />
          </IconButton>
        </Stack>
      </Dialog>
    );
  }

  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      PaperProps={{
        sx: {
          height: { md: '90vh' },
          borderRadius: (theme) => theme.spacing(1)
        }
      }}
      open
      onClose={onClose}
    >
      <Stack direction='row'>
        <Stack
          gap={1}
          sx={{
            width: '40%',
            maxWidth: 300,
            pt: 3,
            backgroundColor: (theme) => theme.palette.sidebar.background
          }}
        >
          <ProposalSourcePropertiesGroup selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} />
        </Stack>
        <Stack gap={1} p={2} overflow='auto' height='90vh' width='100%'>
          <ProposalSourcePropertiesSelector
            selectedGroup={selectedGroup}
            selectedProperties={selectedProperties}
            setSelectedProperties={setSelectedProperties}
          />
        </Stack>
        <Stack
          sx={{
            width: '40%',
            pt: 3,
            height: '90vh',
            backgroundColor: (theme) => theme.palette.sidebar.background
          }}
        >
          <ProposalSourcePropertiesList selectedProperties={selectedProperties} onApply={onApply} />
        </Stack>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 15,
            top: 15,
            zIndex: 1
          }}
        >
          <CloseIcon color='secondary' fontSize='small' />
        </IconButton>
      </Stack>
    </Dialog>
  );
}
