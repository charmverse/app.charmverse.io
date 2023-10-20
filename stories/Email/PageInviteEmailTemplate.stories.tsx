import { v4 } from 'uuid';

import { PageInviteEmail } from 'lib/mailer/emails/templates/PageInviteEmail';

export default {
  title: 'Email/Page Invite',
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
