import type { Space } from '@charmverse/core/prisma';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { hasCustomDomainAccess } from '@packages/subscriptions/featureRestrictions';
import type { UseFormRegister } from 'react-hook-form';

import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import { LabelWithCopy } from 'components/settings/space/components/LabelWithCopy';
import { UpgradeChip, UpgradeWrapper } from 'components/settings/subscription/UpgradeWrapper';
import { useCustomDomainVerification } from 'hooks/useCustomDomainVerification';
import { useIsAdmin } from 'hooks/useIsAdmin';

import type { FormValues } from '../SpaceSettings';

const CNAME_INSTRUCTIONS_URL = 'https://app.charmverse.io/charmverse/page-7475001106586148';
const CAA_INSTRUCTIONS_URL = 'https://app.charmverse.io/charmverse/custom-domain-troubleshooting-16172974411857632';

export function SetupCustomDomain({
  space,
  errorMessage,
  register
}: {
  space: Space;
  errorMessage?: string;
  register: UseFormRegister<FormValues>;
}) {
  const isAdmin = useIsAdmin();
  const hasAccess = hasCustomDomainAccess(space.subscriptionTier);

  const {
    isCustomDomainVerified,
    customDomainVerification,
    showCustomDomainVerification,
    setShowCustomDomainVerification,
    refreshVerification,
    isLoading,
    isRefreshing
  } = useCustomDomainVerification();

  return (
    <Stack>
      <Stack direction='row' gap={1}>
        <FieldLabel>Custom Domain</FieldLabel>
        <Stack>
          <UpgradeChip upgradeContext='custom_domain' />
        </Stack>
      </Stack>
      <Typography variant='caption' mb={2}>
        Add a custom domain you own to access your app through it. You will be prompted with further instructions after
        saving.
      </Typography>
      <UpgradeWrapper upgradeContext='custom_domain'>
        <Stack direction='row' alignItems='start' spacing={1}>
          <TextField
            {...register('customDomain')}
            InputProps={{
              startAdornment: <InputAdornment position='start'>https://</InputAdornment>
            }}
            disabled={!isAdmin || !hasAccess}
            fullWidth
            error={!!errorMessage}
            helperText={
              errorMessage || (!hasAccess ? 'Custom domains are only available for Silver tier and above' : '')
            }
            data-test='space-custom-domain-input'
            placeholder='dao.example.com'
          />
        </Stack>

        {!!space.customDomain && isAdmin && hasAccess && (
          <Accordion
            expanded={showCustomDomainVerification}
            onChange={() => {
              setShowCustomDomainVerification((prev) => !prev);
            }}
            disableGutters
            elevation={0}
            sx={{
              mt: 0.5,
              boxShadow: 'none',
              border: (theme) => ` 1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: 'transparent',
              backgroundImage: 'none',
              '&:before': { backgroundColor: 'transparent' }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls='panel1a-content'
              id='panel1a-header'
              sx={{
                px: 1.5,
                '.MuiAccordionSummary-content': { my: 0 },
                minHeight: 40
              }}
            >
              <Stack direction='row' alignItems='center' gap={1}>
                <Typography variant='subtitle1'>How to set up your domain provider</Typography>

                {isCustomDomainVerified ? (
                  <Chip size='small' label='Setup verified' color='success' icon={<CheckCircleOutlineOutlinedIcon />} />
                ) : customDomainVerification ? (
                  <Chip size='small' label='Action required' color='warning' icon={<ErrorOutlineOutlinedIcon />} />
                ) : null}
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 1.5, pt: 0 }}>
              {isLoading ? (
                <LoadingComponent isLoading size={20} />
              ) : (
                <>
                  <Typography variant='body2'>
                    In order to access space from you domain, you will need to setup two CNAME records in your DNS
                    Provider dashboard. One is to redirect your domain to CharmVerse, and the other is to verify your
                    domain ownership.
                  </Typography>

                  <Stack mt={1}>
                    <Typography variant='caption'>
                      You can find instructions on how to set DNS CNAME records{' '}
                      <Link href={CNAME_INSTRUCTIONS_URL} external target='_blank'>
                        here
                      </Link>
                    </Typography>
                  </Stack>

                  <TableContainer>
                    <Table size='small' sx={{ '.MuiTableCell-root': { px: 0.5 } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Record Name</TableCell>
                          <TableCell>Record Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <LabelWithCopy label={space.customDomain} />
                          </TableCell>
                          <TableCell>
                            <Stack direction='row' alignContent='center' gap={1} justifyContent='space-between'>
                              <LabelWithCopy label={`${space.domain}.charmverse.io`} />

                              {customDomainVerification?.isRedirectVerified ? (
                                <Tooltip title='Redirect record verified'>
                                  <CheckCircleOutlineOutlinedIcon color='success' />
                                </Tooltip>
                              ) : (
                                <Tooltip title='Redirect record does not exist'>
                                  <ErrorOutlineOutlinedIcon color='warning' />
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                        {customDomainVerification?.certificateDetails?.status !== 'FAILED' ? (
                          <TableRow>
                            <TableCell>
                              <LabelWithCopy
                                label={removeEndingPeriod(
                                  customDomainVerification?.certificateDetails?.dnsValidation?.name || ''
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction='row' alignItems='center' gap={1} justifyContent='space-between'>
                                <LabelWithCopy
                                  label={customDomainVerification?.certificateDetails?.dnsValidation?.value || ''}
                                />

                                {customDomainVerification?.isCertificateVerified ? (
                                  <Tooltip title='Domain verification passed'>
                                    <CheckCircleOutlineOutlinedIcon color='success' />
                                  </Tooltip>
                                ) : (
                                  <Tooltip title='Domain verification record does not exist'>
                                    <ErrorOutlineOutlinedIcon color='warning' />
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2}>
                              <Typography variant='body2' color='var(--text-orange)' mx={2}>
                                Due to your DNS provider configuration, we were unable to create certificate for your
                                domain. You can find instruction on how to setup your provider{' '}
                                <Link href={CAA_INSTRUCTIONS_URL} external target='_blank'>
                                  here
                                </Link>
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Stack direction='row' justifyContent='flex-end' mt={2} gap={1}>
                    {isCustomDomainVerified && (
                      <Link href={`https://${space.customDomain}`} external target='_blank'>
                        <Button variant='text'>Go to your domain</Button>
                      </Link>
                    )}
                    <Button loading={isRefreshing} disabled={isRefreshing} onClick={() => refreshVerification()}>
                      Verify setup
                    </Button>
                  </Stack>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        )}
      </UpgradeWrapper>
    </Stack>
  );
}

// DNS setups usually do not expect the trailing period, so we remove it
function removeEndingPeriod(domain: string) {
  return domain.replace(/\.$/, '');
}
