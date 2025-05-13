import type { SyntheticEvent } from 'react';

export default function preventEventDefault(e: SyntheticEvent): void {
  e.preventDefault();
}
