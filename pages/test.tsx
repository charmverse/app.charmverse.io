// import { uid } from 'node_modules/common.charmverse.io/packages/utilities-string/src';
// eslint-disable-next-line import/no-relative-packages, import/no-extraneous-dependencies
import { randomiser } from '@charmverse/core/dist/shared';
import { useEffect, useState } from 'react';

export default function TestPage() {
  const [displayValue, setDisplayValue] = useState(randomiser());

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue(randomiser());
    }, 2000);

    return () => clearInterval(interval);
  }, []);
  return (
    <div>
      <h1>Content {displayValue}</h1>
    </div>
  );
}
