import type { resources } from 'coinbase-commerce-node';

export async function handleCryptoPayment(event: resources.Event) {
  // @TODO - Get space based on event metadata or id and throw an error if no space found

  if (event.type === 'charge:pending') {
    // @TODO Update crypto payment status
    // user paid, but transaction not confirm on blockchain
  }

  if (event.type === 'charge:confirmed') {
    /**
     * @todo
     * 1. Update space
     * 2. Create space subscription
     * 3. Update crypto payment status
     * 4. Create invoice, mark it as paid and send an email with the receipt if possible
     */
  }

  if (event.type === 'charge:failed') {
    // charge failed or expired
    // @TODO Update crypto payment status
  }
}
