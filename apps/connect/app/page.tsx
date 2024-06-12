'use client';

import env from '@beam-australia/react-env';
// import { connectApiClient } from 'connect/api/apiClient';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { connectApiHost } from 'config/constants';

import { connectApiClient } from '../api/apiClient';

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
