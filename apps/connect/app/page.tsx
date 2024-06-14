'use client';

// import { connectApiClient } from 'connect/api/apiClient';
import { useState } from 'react';

import { connectApiClient } from '../apiClient/apiClient';

import styles from './page.module.css';

export default function Home() {
  const [number, setNumber] = useState<number | null>(null);

  async function showRandomNumber() {
    const response = await connectApiClient.test.getRandomNumber();
    setNumber(response.number);
  }

  return (
    <div className={styles.main}>
      {/** Center content */}
      <div className={styles.center}>
        <div className='button' onClick={() => showRandomNumber()}>
          Show Random Number
          {number !== null && <p>Random Number: {number}</p>}
        </div>
      </div>
    </div>
  );
}
