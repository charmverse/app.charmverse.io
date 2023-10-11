import type { User } from '@charmverse/core/prisma';
import { DateTime } from 'luxon';
import { MjmlColumn, MjmlDivider, MjmlSection, MjmlText } from 'mjml-react';

import { BOUNTY_STATUS_COLORS, BOUNTY_STATUS_LABELS } from 'components/bounties/components/BountyStatusBadge';
import { ProposalStatusColors } from 'components/proposals/components/ProposalStatusBadge';
import { baseUrl } from 'config/constants';
import type {
  CardNotification,
  BountyNotification,
  PostNotification,
  ProposalNotification,
  VoteNotification,
  DocumentNotification
} from 'lib/notifications/interfaces';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import { colors, greyColor2 } from 'theme/colors';

import { EmailWrapper, Feedback, Footer, Header } from './components';

const MAX_ITEMS_PER_TASK = 3;
const MAX_CHAR = 60;
type TemplateUser = Pick<User, 'id' | 'username'> & { email: string };
export const buttonStyle = {
  color: '#ffffff',
  lineHeight: '120%',
  textDecoration: 'none',
  borderRadius: '3px',
  fontWeight: '600',
  padding: '10px 30px',
  background: '#009Fb7'
};
const h2Style = { lineHeight: '1.2em', fontSize: '24px', fontWeight: 'bold', marginTop: '10px' };
const h3Style = { lineHeight: '1em', fontSize: '20px', fontWeight: 'bold', marginTop: '8px', marginBottom: '5px' };

export interface PendingNotificationsData {
  // eslint-disable-next-line
  cardNotifications: CardNotification[];
  documentNotifications: DocumentNotification[];
  totalUnreadNotifications: number;
  voteNotifications: VoteNotification[];
  proposalNotifications: ProposalNotification[];
  bountyNotifications: BountyNotification[];
  forumNotifications: PostNotification[];
  // eslint-disable-next-line
  user: TemplateUser;
}

export default function PendingNotifications(props: PendingNotificationsData) {
  const totalDocumentNotifications = props.documentNotifications.length;
  const totalVoteNotifications = props.voteNotifications.length;
  const totalProposalNotifications = props.proposalNotifications.length;
  const totalBountyNotifications = props.bountyNotifications.length;
  const totalForumNotifications = props.forumNotifications.length;
  const totalCardNotifications = props.cardNotifications.length;

  const documentSection =
    totalDocumentNotifications > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalDocumentNotifications} Page Comment{totalDocumentNotifications > 1 ? 's' : ''}
              </span>
            </a>
          </div>
        </MjmlText>
        {props.documentNotifications.slice(0, MAX_ITEMS_PER_TASK).map((documentNotification) => (
          <DocumentNotificationMjml key={documentNotification.id} notification={documentNotification} />
        ))}
        <MjmlDivider />
      </>
    ) : null;

  const proposalSection =
    totalProposalNotifications > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalProposalNotifications} Proposal{totalProposalNotifications > 1 ? 's' : ''}
              </span>
            </a>
          </div>
        </MjmlText>
        {props.proposalNotifications.slice(0, MAX_ITEMS_PER_TASK).map((proposalNotification) => (
          <ProposalNotificationMjml key={proposalNotification.id} notification={proposalNotification} />
        ))}
        <MjmlDivider />
      </>
    ) : null;

  const bountySection =
    totalBountyNotifications > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalBountyNotifications} Bount{totalBountyNotifications > 1 ? 'ies' : 'y'}
              </span>
            </a>
          </div>
        </MjmlText>
        {props.bountyNotifications.slice(0, MAX_ITEMS_PER_TASK).map((proposalNotification) => (
          <BountyNotificationMjml key={proposalNotification.id} notification={proposalNotification} />
        ))}
        <MjmlDivider />
      </>
    ) : null;

  const voteSection =
    totalVoteNotifications > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalVoteNotifications} Poll{totalVoteNotifications > 1 ? 's' : ''}
              </span>
            </a>
          </div>
        </MjmlText>
        {props.voteNotifications.slice(0, MAX_ITEMS_PER_TASK).map((voteNotification) => (
          <VoteNotificationMjml key={voteNotification.id} notification={voteNotification} />
        ))}
        <MjmlDivider />
      </>
    ) : null;

  const cardSection =
    totalCardNotifications > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalCardNotifications} Card Event{totalCardNotifications > 1 ? 's' : ''}
              </span>
            </a>
          </div>
        </MjmlText>
        {props.cardNotifications.slice(0, MAX_ITEMS_PER_TASK).map((cardNotification) => (
          <CardNotificationMjml key={cardNotification.id} notification={cardNotification} />
        ))}
        <MjmlDivider />
      </>
    ) : null;

  const forumSection =
    totalForumNotifications > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalForumNotifications} Forum Event{totalForumNotifications > 1 ? 's' : ''}
              </span>
            </a>
          </div>
        </MjmlText>
        {props.forumNotifications.slice(0, MAX_ITEMS_PER_TASK).map((forumNotification) => (
          <ForumNotificationMjml key={forumNotification.id} notification={forumNotification} />
        ))}
        <MjmlDivider />
      </>
    ) : null;

  return (
    <EmailWrapper title='Your open notifications'>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <Header />

          <MjmlText paddingBottom={0} paddingTop={0}>
            <h3>{notificationsRequiresYourAttention({ count: props.totalUnreadNotifications })}.</h3>
          </MjmlText>
          {proposalSection}
          {voteSection}
          {bountySection}
          {documentSection}
          {forumSection}
          {cardSection}
        </MjmlColumn>
      </MjmlSection>
      <Feedback />
      <Footer />
    </EmailWrapper>
  );
}

function VoteNotificationMjml({ notification }: { notification: VoteNotification }) {
  const pageWorkspaceTitle = `${notification.pageTitle} | ${notification.spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${baseUrl}/${notification.spaceDomain}/${notification.pagePath}`}
        style={{ fontWeight: 'bold', marginBottom: 5, display: 'block', color: 'inherit' }}
      >
        {notification.title.length > MAX_CHAR ? `${notification.title.slice(0, MAX_CHAR)}...` : notification.title}
      </a>
      <div
        style={{
          fontSize: 16,
          marginBottom: 5,
          color: greyColor2,
          fontWeight: 500
        }}
      >
        {pageWorkspaceTitle.length > MAX_CHAR ? `${pageWorkspaceTitle.slice(0, MAX_CHAR)}...` : pageWorkspaceTitle}
      </div>
      <div
        style={{
          color: colors.red.dark,
          fontSize: 14,
          fontWeight: 'bold'
        }}
      >
        Ends {DateTime.fromJSDate(new Date(notification.deadline)).toRelative({ base: DateTime.now() })}
      </div>
    </MjmlText>
  );
}

function ProposalNotificationMjml({ notification }: { notification: ProposalNotification }) {
  const pageWorkspaceTitle = `${notification.pageTitle || 'Untitled'} | ${notification.spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${baseUrl}/${notification.spaceDomain}/${notification.pagePath}`}
        style={{
          display: 'block',
          color: 'inherit'
        }}
      >
        <div style={{ ...h2Style, fontSize: '18px', fontWeight: 'bold', marginBottom: 10 }}>{pageWorkspaceTitle}</div>
      </a>

      <div
        style={{
          fontSize: '0.75rem',
          width: 'fit-content',
          display: 'flex',
          alignItems: 'center',
          height: '24px',
          borderRadius: '16px',
          backgroundColor: colors[ProposalStatusColors[notification.status]].light,
          fontWeight: 500
        }}
      >
        <span style={{ paddingLeft: '8px', paddingRight: '8px' }}>{PROPOSAL_STATUS_LABELS[notification.status]}</span>
      </div>
    </MjmlText>
  );
}

function BountyNotificationMjml({ notification }: { notification: BountyNotification }) {
  const pageWorkspaceTitle = `${notification.pageTitle || 'Untitled'} | ${notification.spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${baseUrl}/${notification.spaceDomain}/${notification.pagePath}`}
        style={{
          color: 'inherit',
          display: 'block'
        }}
      >
        <div style={{ ...h2Style, fontSize: '18px', fontWeight: 'bold', marginBottom: 10 }}>{pageWorkspaceTitle}</div>
      </a>

      <div
        style={{
          fontSize: '0.75rem',
          width: 'fit-content',
          display: 'flex',
          alignItems: 'center',
          height: '24px',
          borderRadius: '16px',
          backgroundColor: colors[BOUNTY_STATUS_COLORS[notification.status]].light,
          fontWeight: 500
        }}
      >
        <span style={{ paddingLeft: '8px', paddingRight: '8px' }}>{BOUNTY_STATUS_LABELS[notification.status]}</span>
      </div>
    </MjmlText>
  );
}

function DocumentNotificationMjml({
  notification: { text, spaceName, pageTitle, pagePath, spaceDomain }
}: {
  notification: DocumentNotification;
}) {
  const pageWorkspaceTitle = `${pageTitle || 'Untitled'} | ${spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${baseUrl}/${spaceDomain}/${pagePath}`}
        style={{ fontWeight: 'bold', marginBottom: 5, display: 'block', color: 'inherit' }}
      >
        {text.length > MAX_CHAR ? `${text.slice(0, MAX_CHAR)}...` : text}
      </a>
      <div
        style={{
          fontSize: 16,
          marginBottom: 5,
          color: greyColor2,
          fontWeight: 500
        }}
      >
        {pageWorkspaceTitle.length > MAX_CHAR ? `${pageWorkspaceTitle.slice(0, MAX_CHAR)}...` : pageWorkspaceTitle}
      </div>
    </MjmlText>
  );
}

function CardNotificationMjml({
  notification: { createdBy, spaceName, pageTitle, pagePath, spaceDomain }
}: {
  notification: CardNotification;
}) {
  const pageWorkspaceTitle = `${pageTitle || 'Untitled'} | ${spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${baseUrl}/${spaceDomain}/${pagePath}`}
        style={{ fontWeight: 'bold', marginBottom: 5, display: 'block', color: 'inherit' }}
      >
        {createdBy.username ? `${createdBy.username} assigned you to a card` : `You were assigned to a card`}
      </a>
      <div
        style={{
          fontSize: 16,
          marginBottom: 5,
          color: greyColor2,
          fontWeight: 500
        }}
      >
        {pageWorkspaceTitle.length > MAX_CHAR ? `${pageWorkspaceTitle.slice(0, MAX_CHAR)}...` : pageWorkspaceTitle}
      </div>
    </MjmlText>
  );
}

function ForumNotificationMjml({
  notification: { spaceName, spaceDomain, postPath, postTitle }
}: {
  notification: PostNotification;
}) {
  const pageWorkspaceTitle = `${postTitle || 'Untitled'} | ${spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${baseUrl}/${spaceDomain}/forum/post/${postPath}`}
        style={{ fontWeight: 'bold', marginBottom: 5, display: 'block', color: 'inherit' }}
      >
        {postTitle}
      </a>
      <div
        style={{
          fontSize: 16,
          marginBottom: 5,
          color: greyColor2,
          fontWeight: 500
        }}
      >
        {pageWorkspaceTitle.length > MAX_CHAR ? `${pageWorkspaceTitle.slice(0, MAX_CHAR)}...` : pageWorkspaceTitle}
      </div>
    </MjmlText>
  );
}

export function notificationsRequiresYourAttention({ count, includeName }: { count: number; includeName?: boolean }) {
  return `${count} ${includeName ? 'CharmVerse ' : ''}notification${count > 1 ? 's' : ''} need${
    count > 1 ? '' : 's'
  } your attention`;
}
