import { v4 } from 'uuid';

import { PageInviteEmail } from 'lib/mailer/emails/templates/PageInviteTemplate';

export default {
  title: 'Emails/Page Invite',
  component: PageInviteEmailTemplate
};

export function PageInviteEmailTemplate() {
  return (
    <PageInviteEmail
      guestEmail='john.doe@gmail.com'
      invitingUserName='John Doe'
      pageId={v4()}
      pageTitle='Example Page'
    />
  );
}
