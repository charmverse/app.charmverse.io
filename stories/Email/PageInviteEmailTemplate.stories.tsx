import { v4 } from 'uuid';

import { PageInviteEmail } from 'lib/mailer/emails/templates/PageInviteEmail';

export default {
  title: 'Email/Page Invite',
  component: PageInviteEmailTemplateComponent
};

export function PageInviteEmailTemplateComponent() {
  return (
    <PageInviteEmail
      guestEmail='john.doe@gmail.com'
      invitingUserName='John Doe'
      pageId={v4()}
      pageTitle='Example Page'
    />
  );
}
