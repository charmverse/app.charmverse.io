'use client';

import Image from 'next/image';
import { useState } from 'react';

import { GET } from 'adapters/http';

import styles from './page.module.css';

export default function Home() {
  const [number, setNumber] = useState<number | null>(null);

  async function showRandomNumber() {
    const response = await GET<{ number: number }>('/api/random-number');
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
