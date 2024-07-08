import * as yup from 'yup';

export const CATEGORIES = ['CeFi', 'Cross Chain', 'DeFi', 'Governance', 'NFT', 'Social', 'Utility'] as const;

export const schema = yup.object({
  name: yup.string().required('Project name is required'),
  description: yup.string(),
  avatar: yup.string(),
  coverImage: yup.string(),
  category: yup.string().oneOf(CATEGORIES),
  websites: yup.array(yup.string().url()),
  farcasterValues: yup.array(yup.string()),
  github: yup.string(),
  twitter: yup.string(),
  mirror: yup.string(),
  projectMembers: yup
    .array(
      yup.object({
        name: yup.string().required(),
        farcasterId: yup.number().required()
      })
    )
    .required()
    .min(1)
});

export type FormValues = yup.InferType<typeof schema>;
