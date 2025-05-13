import { Typography } from '@mui/material';

import Link from 'components/common/Link';

/**
 * We use Docusign Connect webhooks to receive updates about documents
 * https://support.docusign.com/s/document-item?language=en_US&rsc_301&bundleId=pik1583277475390&topicId=ctv1583277395112.html&_LANG=enus
 */
export function ConnectInfo() {
  return (
    <Typography variant='body2'>
      Running into Docusign Connect webhook errors? Follow{' '}
      <Link
        external
        target='_blank'
        href='https://support.docusign.com/s/articles/ERROR-This-Account-lacks-sufficient-permissions-Connect-not-enabled-for-account?language=en_US'
      >
        these steps
      </Link>{' '}
    </Typography>
  );
}
