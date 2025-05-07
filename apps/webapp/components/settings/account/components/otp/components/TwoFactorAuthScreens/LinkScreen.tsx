import { useTwoFactorAuth } from '../../hooks/useTwoFactorAuth';
import { CodeDetails } from '../CodeDetails';

export function LinkScreen() {
  const { data, setFlow } = useTwoFactorAuth();

  if (!data) {
    return null;
  }

  return <CodeDetails onSubmit={() => setFlow('confirmation')} uri={data.uri} code={data.code} btnText='Next' />;
}
