import coinbase from 'coinbase-commerce-node';

const Client = coinbase.Client;

export const Options = Client.init(process.env.COINBASE_COMMERCE_KEY as string);
export const Charge = coinbase.resources.Charge;
export const Webhook = coinbase.Webhook;
