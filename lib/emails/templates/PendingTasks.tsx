import {
  MjmlSection,
  MjmlColumn,
  MjmlText,
  MjmlButton
} from 'mjml-react';
import { User } from '@prisma/client';
import { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { shortenHex } from 'lib/utilities/strings';
import { greyColor2 } from 'theme/colors';
import log from 'lib/log';
import { MentionedTask } from 'lib/mentions/interfaces';
import { VoteTask } from 'lib/votes/interfaces';
import { DateTime } from 'luxon';
import { HR, Feedback, Footer, Header, EmailWrapper } from './components';

type TemplateUser = Pick<User, 'id' | 'username'> & { email: string };
const charmverseUrl = process.env.DOMAIN;

export interface PendingTasksProps {
  user: TemplateUser;
  gnosisSafeTasks: GnosisSafeTasks[];
  mentionedTasks: MentionedTask[]
  totalTasks: number
  voteTasks: VoteTask[]
}

export default function PendingTasks (props: PendingTasksProps) {

  const totalMentions = props.mentionedTasks.length;
  const totalVotes = props.voteTasks.length;

  return (

    <EmailWrapper title='Your open tasks'>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <Header />

          <MjmlText paddingBottom={0} paddingTop={0}>
            <h3>Hello {props.user.username}</h3>
            <h2>{props.totalTasks} tasks need your attention.</h2>
          </MjmlText>

          {props.gnosisSafeTasks.map(gnosisSafeTask => <MultisigTask key={gnosisSafeTask.safeAddress} task={gnosisSafeTask} />)}

          <MjmlText>
            <a
              href={`${charmverseUrl}/nexus?task=discussion`}
            >
              <h2>{totalMentions} Mention{totalMentions > 1 ? 's' : ''}</h2>
            </a>

          </MjmlText>
          {props.mentionedTasks.map(mentionedTask => (
            <MentionTask
              key={mentionedTask.mentionId}
              task={mentionedTask}
            />
          ))}

          <MjmlText>
            <a
              href={`${charmverseUrl}/nexus?task=discussion`}
            >
              <h2>{totalVotes} Vote{totalVotes > 1 ? 's' : ''}</h2>
            </a>

          </MjmlText>
          {props.voteTasks.map(voteTask => (
            <VoteTaskMjml
              key={voteTask.id}
              task={voteTask}
            />
          ))}

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

  return (
    <>
      <MjmlText paddingBottom={10}>
        <div style={{ fontWeight: 'bold', color: greyColor2, marginBottom: 5 }}>
          {task.title} <br />Ends {DateTime.fromJSDate(new Date(task.deadline)).toRelative({ base: (DateTime.now()) })}
        </div>
        <a href={voteTaskLink}>
          <div>
            <h2>{task.page.title || 'Untitled'} | {task.space.name}</h2>
          </div>
        </a>
      </MjmlText>
      <MjmlButton align='left' padding-bottom='40px' href={voteTaskLink}>
        Vote
      </MjmlButton>
    </>
  );
}

function MentionTask ({ task: { text, spaceDomain, spaceName, pagePath, pageTitle, mentionId } }: {task: MentionedTask}) {
  return (
    <MjmlText paddingBottom={10}>
      <div style={{ fontWeight: 'bold', color: greyColor2, marginBottom: 5 }}>
        {text}
      </div>
      <a href={`${charmverseUrl}/${spaceDomain}/${pagePath}?mentionId=${mentionId}`}>
        <div>
          <h2>{pageTitle || 'Untitled'} | {spaceName}</h2>
        </div>
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
        <a href={`${charmverseUrl}/nexus?task=multisig`}>
          <h2>Multi sig transaction</h2>
        </a>
        <strong style={{ color: greyColor2 }}>
          Safe address: {shortenHex(task.safeAddress)}<br />
          {task.tasks[0].transactions[0].description}
        </strong>
      </MjmlText>
      <MjmlButton align='left' padding-bottom='40px' href={task.tasks[0].transactions[0].myActionUrl}>
        {task.tasks[0].transactions[0].myAction}
      </MjmlButton>
    </>
  );
}
