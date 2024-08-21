import { v4 } from 'uuid';

import { PageInviteTemplate } from 'lib/mailer/emails/templates/PageInviteTemplate';

export default {
  title: 'Emails/Page Invite',
  component: PageInviteEmailTemplate
};

export function PageInviteEmailTemplate() {
  return (
    <PageInviteTemplate
      guestEmail='john.doe@gmail.com'
      invitingUserName='John Doe'
      pageId={v4()}
      pageTitle='Example Page'
    />
  );
}
