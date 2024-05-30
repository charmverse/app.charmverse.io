'use client';

// import { GET } from '@charmverse/core/http';
import Image from 'next/image';

import styles from './page.module.css';

export default function Home() {
  // const [number, setNumber] = useState<number | null>(null);

  async function showRandomNumber() {
    console.log('Clicked');
    // const response = await GET<{ number: number }>('/api/random-number');
    // console.log(response);
    // setNumber(response.number);
  }

  return (
    <div className={styles.main}>
      {/** Center content */}
      <div className={styles.center}>
        <div className='button' onClick={() => showRandomNumber()}>
          Show Random Number
        </div>
        {/* {number !== null && <p>Random Number: {number}</p>} */}
      </div>
    </div>
  );
}
