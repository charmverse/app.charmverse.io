import {
  MjmlSection,
  MjmlColumn,
  MjmlText,
  MjmlDivider
} from 'mjml-react';
import { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { shortenHex } from 'lib/utilities/strings';
import { darkModeColors, greyColor2 } from 'theme/colors';
import log from 'lib/log';
import { MentionedTask } from 'lib/mentions/interfaces';
import { VoteTask } from 'lib/votes/interfaces';
import { DateTime } from 'luxon';
import { User } from '@prisma/client';
import { Feedback, Footer, Header, EmailWrapper } from './components';

const charmverseUrl = process.env.DOMAIN;

const MAX_ITEMS_PER_TASK = 3;
const MAX_CHAR = 60;
type TemplateUser = Pick<User, 'id' | 'username'> & { email: string };
const buttonStyle = { color: '#ffffff', lineHeight: '120%', textDecoration: 'none', borderRadius: '3px', fontWeight: '600', padding: '10px 30px', background: '#009Fb7' };
const h2Style = { lineHeight: '1.2em', fontSize: '24px', fontWeight: 'bold', marginTop: '10px' };

export interface PendingTasksProps {
  gnosisSafeTasks: GnosisSafeTasks[];
  mentionedTasks: MentionedTask[]
  totalTasks: number
  voteTasks: VoteTask[]
  // eslint-disable-next-line
  user: TemplateUser
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
        <div style={{
          marginBottom: 15
        }}
        >
          <a
            href={nexusDiscussionLink}
            style={{
              marginRight: 15
            }}
          >
            <span style={h2Style}>{totalMentionTasks} Mention{totalMentionTasks > 1 ? 's' : ''}</span>
          </a>
          <a href={nexusVoteLink} style={buttonStyle}>
            View
          </a>
        </div>
      </MjmlText>
      {props.mentionedTasks.slice(0, MAX_ITEMS_PER_TASK).map(mentionedTask => (
        <MentionTask
          key={mentionedTask.mentionId}
          task={mentionedTask}
        />
      ))}
      {totalMentionTasks > MAX_ITEMS_PER_TASK ? <ViewAllText href={nexusDiscussionLink} /> : null}
      <MjmlDivider />
    </>
  ) : null;

  const voteSection = totalVoteTasks > 0 ? (
    <>
      <MjmlText>
        <div style={{
          marginBottom: 15
        }}
        >
          <a
            href={nexusVoteLink}
            style={{
              marginRight: 15
            }}
          >
            <span style={h2Style}>{totalVoteTasks} Vote{totalVoteTasks > 1 ? 's' : ''}</span>
          </a>
          <a href={nexusVoteLink} style={buttonStyle}>
            Vote now
          </a>
        </div>
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
        <div>
          <a
            href={nexusMultisigLink}
            style={{
              marginRight: 15
            }}
          >
            <span style={h2Style}>{totalGnosisSafeTasks} Multisig{totalGnosisSafeTasks > 1 ? 's' : ''}</span>
          </a>
          <a href={nexusMultisigLink} style={buttonStyle}>
            Sign
          </a>
        </div>
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
            <h3>{tasksRequiresYourAttention({ count: props.totalTasks })}.</h3>
          </MjmlText>
          {multisigSection}
          {voteSection}
          {mentionSection}

        </MjmlColumn>
      </MjmlSection>
      <Feedback />
      <Footer />
    </EmailWrapper>
  );
}

function VoteTaskMjml ({ task }: {task: VoteTask}) {
  const pageWorkspaceTitle = `${task.page.title || 'Untitled'} | ${task.space.name}`;
  return (
    <MjmlText>
      <div style={{ fontWeight: 'bold', color: '#000', marginBottom: 5 }}>
        {task.title.length > MAX_CHAR ? `${task.title.slice(0, MAX_CHAR)}...` : task.title}
      </div>
      <div style={{
        fontSize: 16,
        marginBottom: 5,
        color: greyColor2,
        fontWeight: 500
      }}
      >{pageWorkspaceTitle.length > MAX_CHAR ? `${pageWorkspaceTitle.slice(0, MAX_CHAR)}...` : pageWorkspaceTitle}
      </div>
      <div style={{
        color: darkModeColors.red,
        fontSize: 14,
        fontWeight: 'bold'
      }}
      >
        Ends {DateTime.fromJSDate(new Date(task.deadline)).toRelative({ base: (DateTime.now()) })}
      </div>
    </MjmlText>
  );
}

function MentionTask ({ task: { text, spaceName, pageTitle } }: {task: MentionedTask}) {
  const pageWorkspaceTitle = `${pageTitle || 'Untitled'} | ${spaceName}`;
  return (
    <MjmlText>
      <div style={{ fontWeight: 'bold', color: '#000', marginBottom: 5 }}>
        {text.length > MAX_CHAR ? `${text.slice(0, MAX_CHAR)}...` : text}
      </div>
      <div style={{
        fontSize: 16,
        marginBottom: 5,
        color: greyColor2,
        fontWeight: 500
      }}
      >{pageWorkspaceTitle.length > MAX_CHAR ? `${pageWorkspaceTitle.slice(0, MAX_CHAR)}...` : pageWorkspaceTitle}
      </div>
    </MjmlText>
  );
}

function MultisigTask ({ task }: { task: GnosisSafeTasks }) {
  log.debug('multi sig task', task);
  // console.log('multi sig task...', task.tasks[0].transactions);
  return (
    <MjmlText>
      <strong style={{ color: '#000' }}>
        Safe address: {shortenHex(task.safeAddress)}<br />
        {task.tasks[0].transactions[0].description}
      </strong>
    </MjmlText>
  );
}

export function tasksRequiresYourAttention ({ count, includeName }: { count: number, includeName?: boolean }) {
  return `${count} ${includeName ? 'CharmVerse ' : ''}task${count > 0 ? 's' : ''} need${count > 0 ? '' : 's'} your attention`;
}
