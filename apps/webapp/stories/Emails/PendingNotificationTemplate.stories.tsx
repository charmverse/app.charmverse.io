import { emptyDocument } from '@packages/charmeditor/constants';
import { NotificationTemplate } from '@packages/lib/mailer/emails/templates/NotificationTemplate';
import { getCurrentDate } from '@packages/lib/utils/dates';
import { v4 } from 'uuid';

const userId = v4();

export default {
  title: 'Emails/Notification',
  component: PendingNotificationTemplate
};

export function PendingNotificationTemplate() {
  return (
    <NotificationTemplate
      notification={{
        applicationCommentId: null,
        applicationId: null,
        group: 'document',
        archived: false,
        commentId: null,
        content: emptyDocument,
        createdAt: getCurrentDate().toDateString(),
        createdBy: {
          avatar: null,
          avatarChain: null,
          avatarContract: null,
          avatarTokenId: null,
          deletedAt: null,
          id: userId,
          path: 'john-doe',
          username: 'John Doe'
        },
        id: userId,
        inlineCommentId: null,
        mentionId: v4(),
        pageId: v4(),
        pagePath: 'example-path',
        pageTitle: 'Example Page',
        pageType: 'page',
        read: false,
        spaceDomain: 'example',
        spaceId: v4(),
        spaceName: 'Example',
        type: 'mention.created'
      }}
      user={{
        avatar: null,
        id: v4(),
        username: 'Doe John'
      }}
      spaceFeatures={[
        {
          id: 'rewards',
          isHidden: false,
          title: 'Rewards'
        }
      ]}
    />
  );
}
