import type { User } from '@prisma/client';
import { DateTime } from 'luxon';
import { MjmlColumn, MjmlDivider, MjmlSection, MjmlText } from 'mjml-react';

import { BOUNTY_STATUS_COLORS, BOUNTY_STATUS_LABELS } from 'components/bounties/components/BountyStatusBadge';
import { ProposalStatusColors } from 'components/proposals/components/ProposalStatusBadge';
import type { BountyTask } from 'lib/bounties/getBountyTasks';
import { DiscussionTask } from 'lib/discussion/interfaces';
import { ForumTask } from 'lib/forums/comments/interface';
import type { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import log from 'lib/log';
import type { ProposalTask } from 'lib/proposal/getProposalTasksFromWorkspaceEvents';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import { shortenHex } from 'lib/utilities/strings';
import type { VoteTask } from 'lib/votes/interfaces';
import { colors, greyColor2 } from 'theme/colors';

import { EmailWrapper, Feedback, Footer, Header } from './components';

const charmverseUrl = process.env.DOMAIN;

const MAX_ITEMS_PER_TASK = 3;
const MAX_CHAR = 60;
type TemplateUser = Pick<User, 'id' | 'username'> & { email: string };
const buttonStyle = {
  color: '#ffffff',
  lineHeight: '120%',
  textDecoration: 'none',
  borderRadius: '3px',
  fontWeight: '600',
  padding: '10px 30px',
  background: '#009Fb7'
};
const h2Style = { lineHeight: '1.2em', fontSize: '24px', fontWeight: 'bold', marginTop: '10px' };

export interface PendingTasksProps {
  gnosisSafeTasks: GnosisSafeTasks[];
  discussionTasks: DiscussionTask[];
  totalTasks: number;
  voteTasks: VoteTask[];
  proposalTasks: ProposalTask[];
  bountyTasks: BountyTask[];
  forumTasks: ForumTask[];
  // eslint-disable-next-line
  user: TemplateUser
}

function ViewAllText({ href }: { href: string }) {
  return (
    <MjmlText>
      <a href={href}>
        <h4 style={{ marginBottom: 0 }}>View all</h4>
      </a>
    </MjmlText>
  );
}

export default function PendingTasks(props: PendingTasksProps) {
  const totalDiscussionTasks = props.discussionTasks.length;
  const totalVoteTasks = props.voteTasks.length;
  const totalGnosisSafeTasks = props.gnosisSafeTasks.length;
  const totalProposalTasks = props.proposalTasks.length;
  const totalBountyTasks = props.bountyTasks.length;
  const totalForumTasks = props.forumTasks.length;

  const nexusDiscussionLink = `${charmverseUrl}/nexus?task=discussion`;
  const nexusVoteLink = `${charmverseUrl}/nexus?task=vote`;
  const nexusMultisigLink = `${charmverseUrl}/nexus?task=multisig`;
  const nexusProposalLink = `${charmverseUrl}/nexus?task=proposal`;
  const nexusBountyLink = `${charmverseUrl}/nexus?task=bounty`;
  const nexusForumLink = `${charmverseUrl}/nexus?task=forum`;

  const discussionSection =
    totalDiscussionTasks > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              href={nexusDiscussionLink}
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalDiscussionTasks} Page Comment{totalDiscussionTasks > 1 ? 's' : ''}
              </span>
            </a>
            <a href={nexusDiscussionLink} style={buttonStyle}>
              View
            </a>
          </div>
        </MjmlText>
        {props.discussionTasks.slice(0, MAX_ITEMS_PER_TASK).map((discussionTask) => (
          <DiscussionTask key={discussionTask.mentionId} task={discussionTask} />
        ))}
        {totalDiscussionTasks > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusDiscussionLink} /> : null}
        <MjmlDivider />
      </>
    ) : null;

  const proposalSection =
    totalProposalTasks > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              href={nexusProposalLink}
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalProposalTasks} Proposal{totalProposalTasks > 1 ? 's' : ''}
              </span>
            </a>
            <a href={nexusProposalLink} style={buttonStyle}>
              View
            </a>
          </div>
        </MjmlText>
        {props.proposalTasks.slice(0, MAX_ITEMS_PER_TASK).map((proposalTask) => (
          <ProposalTaskMjml key={proposalTask.id} task={proposalTask} />
        ))}
        {totalProposalTasks > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusProposalLink} /> : null}
        <MjmlDivider />
      </>
    ) : null;

  const bountySection =
    totalBountyTasks > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              href={nexusBountyLink}
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalBountyTasks} Bount{totalBountyTasks > 1 ? 'ies' : 'y'}
              </span>
            </a>
            <a href={nexusBountyLink} style={buttonStyle}>
              View
            </a>
          </div>
        </MjmlText>
        {props.bountyTasks.slice(0, MAX_ITEMS_PER_TASK).map((proposalTask) => (
          <BountyTaskMjml key={proposalTask.id} task={proposalTask} />
        ))}
        {totalBountyTasks > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusProposalLink} /> : null}
        <MjmlDivider />
      </>
    ) : null;

  const voteSection =
    totalVoteTasks > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              href={nexusVoteLink}
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalVoteTasks} Poll{totalVoteTasks > 1 ? 's' : ''}
              </span>
            </a>
            <a href={nexusVoteLink} style={buttonStyle}>
              Vote now
            </a>
          </div>
        </MjmlText>
        {props.voteTasks.slice(0, MAX_ITEMS_PER_TASK).map((voteTask) => (
          <VoteTaskMjml key={voteTask.id} task={voteTask} />
        ))}
        {totalVoteTasks > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusVoteLink} /> : null}
        <MjmlDivider />
      </>
    ) : null;

  const multisigSection =
    totalGnosisSafeTasks > 0 ? (
      <>
        <MjmlText>
          <div>
            <a
              href={nexusMultisigLink}
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalGnosisSafeTasks} Multisig{totalGnosisSafeTasks > 1 ? 's' : ''}
              </span>
            </a>
            <a href={nexusMultisigLink} style={buttonStyle}>
              Sign
            </a>
          </div>
        </MjmlText>
        {props.gnosisSafeTasks.slice(0, MAX_ITEMS_PER_TASK).map((gnosisSafeTask) => (
          <MultisigTask key={gnosisSafeTask.safeAddress} task={gnosisSafeTask} />
        ))}
        {totalGnosisSafeTasks > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusMultisigLink} /> : null}
        <MjmlDivider />
      </>
    ) : null;

  const forumSection =
    totalForumTasks > 0 ? (
      <>
        <MjmlText>
          <div
            style={{
              marginBottom: 15
            }}
          >
            <a
              href={nexusForumLink}
              style={{
                marginRight: 15
              }}
            >
              <span style={h2Style}>
                {totalForumTasks} Forum Comment{totalForumTasks > 1 ? 's' : ''}
              </span>
            </a>
            <a href={nexusForumLink} style={buttonStyle}>
              View
            </a>
          </div>
        </MjmlText>
        {props.forumTasks.slice(0, MAX_ITEMS_PER_TASK).map((forumTask) => (
          <ForumTask key={forumTask.commentId} task={forumTask} />
        ))}
        {totalForumTasks > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusForumLink} /> : null}
        <MjmlDivider />
      </>
    ) : null;

  return (
    <EmailWrapper title='Your open tasks'>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <Header />

          <MjmlText paddingBottom={0} paddingTop={0}>
            <h3>{tasksRequiresYourAttention({ count: props.totalTasks })}.</h3>
          </MjmlText>
          {multisigSection}
          {proposalSection}
          {voteSection}
          {bountySection}
          {discussionSection}
          {forumSection}
        </MjmlColumn>
      </MjmlSection>
      <Feedback />
      <Footer />
    </EmailWrapper>
  );
}

function VoteTaskMjml({ task }: { task: VoteTask }) {
  const pageWorkspaceTitle = `${task.page.title || 'Untitled'} | ${task.space.name}`;
  return (
    <MjmlText>
      <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
        {task.title.length > MAX_CHAR ? `${task.title.slice(0, MAX_CHAR)}...` : task.title}
      </div>
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
        Ends {DateTime.fromJSDate(new Date(task.deadline)).toRelative({ base: DateTime.now() })}
      </div>
    </MjmlText>
  );
}

function ProposalTaskMjml({ task }: { task: ProposalTask }) {
  const pageWorkspaceTitle = `${task.pageTitle || 'Untitled'} | ${task.spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${charmverseUrl}/${task.spaceDomain}/${task.pagePath}`}
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
          backgroundColor: colors[ProposalStatusColors[task.status]].light,
          fontWeight: 500
        }}
      >
        <span style={{ paddingLeft: '8px', paddingRight: '8px' }}>{PROPOSAL_STATUS_LABELS[task.status]}</span>
      </div>
    </MjmlText>
  );
}

function BountyTaskMjml({ task }: { task: BountyTask }) {
  const pageWorkspaceTitle = `${task.pageTitle || 'Untitled'} | ${task.spaceName}`;
  return (
    <MjmlText>
      <a
        href={`${charmverseUrl}/${task.spaceDomain}/${task.pagePath}`}
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
          backgroundColor: colors[BOUNTY_STATUS_COLORS[task.status]].light,
          fontWeight: 500
        }}
      >
        <span style={{ paddingLeft: '8px', paddingRight: '8px' }}>{BOUNTY_STATUS_LABELS[task.status]}</span>
      </div>
    </MjmlText>
  );
}

function DiscussionTask({ task: { text, spaceName, pageTitle } }: { task: DiscussionTask }) {
  const pageWorkspaceTitle = `${pageTitle || 'Untitled'} | ${spaceName}`;
  return (
    <MjmlText>
      <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
        {text.length > MAX_CHAR ? `${text.slice(0, MAX_CHAR)}...` : text}
      </div>
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

function MultisigTask({ task }: { task: GnosisSafeTasks }) {
  log.debug('multi sig task', task);
  return (
    <MjmlText>
      <strong>
        Safe address: {shortenHex(task.safeAddress)}
        <br />
        {task.tasks[0].transactions[0].description}
      </strong>
    </MjmlText>
  );
}

function ForumTask({ task: { commentText, spaceName, postTitle } }: { task: ForumTask }) {
  const pageWorkspaceTitle = `${postTitle || 'Untitled'} | ${spaceName}`;
  return (
    <MjmlText>
      <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
        {commentText.length > MAX_CHAR ? `${commentText.slice(0, MAX_CHAR)}...` : commentText}
      </div>
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

export function tasksRequiresYourAttention({ count, includeName }: { count: number; includeName?: boolean }) {
  return `${count} ${includeName ? 'CharmVerse ' : ''}task${count > 1 ? 's' : ''} need${
    count > 1 ? '' : 's'
  } your attention`;
}
