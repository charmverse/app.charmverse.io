import { NextApiRequest, NextApiResponse } from 'next';

const workspace = {
  id: '0',
  settings: {},
  title: ''
};

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.json(workspace);
  }
}
