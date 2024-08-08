import { useTrackPageView } from 'charmClient/hooks/track';
import { CharmsView } from 'components/settings/charms/components/CharmsView';
import Legend from 'components/settings/components/Legend';

export function CharmsSettings() {
  useTrackPageView({ type: 'settings/my-charms' });

  return (
    <>
      <Legend>Charms</Legend>
      <CharmsView />
    </>
  );
}
