import type { QuestInfo } from 'lib/users/getUserQuests';

export function QuestsList({ quests }: { quests: QuestInfo[] }) {
  return (
    <div>
      {quests.map((quest) => (
        <div key={quest.activity}>{quest.label}</div>
      ))}
    </div>
  );
}
