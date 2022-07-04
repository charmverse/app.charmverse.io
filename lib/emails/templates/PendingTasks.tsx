import {
  MjmlSection,
  MjmlColumn,
  MjmlText,
  MjmlButton,
  MjmlDivider
} from 'mjml-react';
import { User } from '@prisma/client';
import { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { shortenHex } from 'lib/utilities/strings';
import { darkModeColors, greyColor2 } from 'theme/colors';
import log from 'lib/log';
import { MentionedTask } from 'lib/mentions/interfaces';
import { VoteTask } from 'lib/votes/interfaces';
import { DateTime } from 'luxon';
import { HR, Feedback, Footer, Header, EmailWrapper } from './components';

type TemplateUser = Pick<User, 'id' | 'username'> & { email: string };
const charmverseUrl = process.env.DOMAIN;

const MAX_ITEMS_PER_TASK = 3;
const MAX_CHAR = 60;

export interface PendingTasksProps {
  user: TemplateUser;
  gnosisSafeTasks: GnosisSafeTasks[];
  mentionedTasks: MentionedTask[]
  totalTasks: number
  voteTasks: VoteTask[]
}

function ViewAllText ({ href }: {href: string}) {
  return (
    <MjmlText>
      <a
        href={href}
      >
        <h4 style={{ marginBottom: 0 }}>View all</h4>
      </a>
    </MjmlText>
  );
}

export default function PendingTasks (props: PendingTasksProps) {

  const totalMentionTasks = props.mentionedTasks.length;
  const totalVoteTasks = props.voteTasks.length;
  const totalGnosisSafeTasks = props.gnosisSafeTasks.length;

  const nexusDiscussionLink = `${charmverseUrl}/nexus?task=discussion`;
  const nexusVoteLink = `${charmverseUrl}/nexus?task=vote`;
  const nexusMultisigLink = `${charmverseUrl}/nexus?task=multisig`;

  const mentionSection = totalMentionTasks > 0 ? (
    <>
      <MjmlText>
        <a
          href={nexusDiscussionLink}
        >
          <h2 style={{ marginBottom: 0 }}>{totalMentionTasks} Mention{totalMentionTasks > 1 ? 's' : ''}</h2>
        </a>

      </MjmlText>
      {props.mentionedTasks.slice(0, MAX_ITEMS_PER_TASK).map(mentionedTask => (
        <MentionTask
          key={mentionedTask.mentionId}
          task={mentionedTask}
        />
      ))}
      {totalMentionTasks > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusDiscussionLink} /> : null}
    </>
  ) : null;

  const voteSection = totalVoteTasks > 0 ? (
    <>
      <MjmlText>
        <a
          href={nexusVoteLink}
        >
          <h2 style={{ marginBottom: 0 }}>{totalVoteTasks} Vote{totalVoteTasks > 1 ? 's' : ''}</h2>
        </a>
      </MjmlText>
      {props.voteTasks.slice(0, MAX_ITEMS_PER_TASK).map(voteTask => (
        <VoteTaskMjml
          key={voteTask.id}
          task={voteTask}
        />
      ))}
      {totalVoteTasks > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusVoteLink} /> : null}
      <MjmlDivider />
    </>
  ) : null;

  const multisigSection = totalGnosisSafeTasks > 0 ? (
    <>
      <MjmlText>
        <a href={nexusMultisigLink}>
          <h2 style={{ marginBottom: 0 }}>{totalGnosisSafeTasks} Multisig transaction{totalGnosisSafeTasks > 1 ? 's' : ''}</h2>
        </a>
      </MjmlText>
      {props.gnosisSafeTasks.slice(0, MAX_ITEMS_PER_TASK).map(
        gnosisSafeTask => <MultisigTask key={gnosisSafeTask.safeAddress} task={gnosisSafeTask} />
      )}
      {totalGnosisSafeTasks > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusMultisigLink} /> : null}
      <MjmlDivider />
    </>
  ) : null;

  return (

    <EmailWrapper title='Your open tasks'>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <Header />

          <MjmlText paddingBottom={0} paddingTop={0}>
            <h3>Hello {props.user.username}</h3>
            <h2>{props.totalTasks} tasks need your attention.</h2>
          </MjmlText>

          {multisigSection}
          {voteSection}
          {mentionSection}

        </MjmlColumn>
      </MjmlSection>

      <HR />

      <Feedback />
      <Footer />
    </EmailWrapper>
  );
}

function VoteTaskMjml ({ task }: {task: VoteTask}) {
  const voteTaskLink = `${charmverseUrl}/${task.space.domain}/${task.page.path}?voteId=${task.id}`;
  const pageWorkspaceTitle = `${task.page.title || 'Untitled'} | ${task.space.name}`;
  return (
    <>
      <MjmlText>
        <div style={{ fontWeight: 'bold', color: greyColor2, marginBottom: 5 }}>
          {task.title.length > MAX_CHAR ? `${task.title.slice(0, MAX_CHAR)}...` : task.title}
        </div>
        <a href={voteTaskLink}>
          <h2 style={{
            fontSize: 16,
            marginBottom: 5
          }}
          >{pageWorkspaceTitle.length > MAX_CHAR ? `${pageWorkspaceTitle.slice(0, MAX_CHAR)}...` : pageWorkspaceTitle}
          </h2>
        </a>
        <div style={{
          color: darkModeColors.red,
          fontSize: 14,
          fontWeight: 'bold'
        }}
        >
          Ends {DateTime.fromJSDate(new Date(task.deadline)).toRelative({ base: (DateTime.now()) })}
        </div>
      </MjmlText>
      <MjmlButton align='left' padding-bottom='20px' href={voteTaskLink}>
        Vote
      </MjmlButton>
    </>
  );
}

function MentionTask ({ task: { text, spaceDomain, spaceName, pagePath, pageTitle, mentionId } }: {task: MentionedTask}) {
  const pageWorkspaceTitle = `${pageTitle || 'Untitled'} | ${spaceName}`;
  return (
    <MjmlText>
      <div style={{ fontWeight: 'bold', color: greyColor2, marginBottom: 5 }}>
        {text.length > MAX_CHAR ? `${text.slice(0, MAX_CHAR)}...` : text}
      </div>
      <a href={`${charmverseUrl}/${spaceDomain}/${pagePath}?mentionId=${mentionId}`}>
        <h2 style={{
          fontSize: 16,
          marginBottom: 5
        }}
        >{pageWorkspaceTitle.length > MAX_CHAR ? `${pageWorkspaceTitle.slice(0, MAX_CHAR)}...` : pageWorkspaceTitle}
        </h2>
      </a>
    </MjmlText>
  );
}

function MultisigTask ({ task }: { task: GnosisSafeTasks }) {
  log.debug('multi sig task', task);
  // console.log('multi sig task...', task.tasks[0].transactions);
  return (
    <>
      <MjmlText>
        <strong style={{ color: greyColor2 }}>
          Safe address: {shortenHex(task.safeAddress)}<br />
          {task.tasks[0].transactions[0].description}
        </strong>
      </MjmlText>
      <MjmlButton align='left' padding-bottom='20px' href={task.tasks[0].transactions[0].myActionUrl}>
        {task.tasks[0].transactions[0].myAction}
      </MjmlButton>
    </>
  );
}
