import { CATEGORIES } from '@connect-shared/lib/projects/projectSchema';
import * as yup from 'yup';

export const schema = yup.object({
  id: yup.string(),
  name: yup.string().required('Project name is required'),
  description: yup.string(),
  avatar: yup.string(),
  coverImage: yup.string(),
  optimismCategory: yup.string().oneOf(CATEGORIES),
  websites: yup.array(yup.string().url()),
  farcasterValues: yup.array(yup.string()),
  github: yup.string(),
  twitter: yup.string(),
  mirror: yup.string(),
  projectMembers: yup
    .array(
      yup.object({
        farcasterId: yup.number().required()
      })
    )
    .required()
    .min(1)
});

export type FormValues = yup.InferType<typeof schema>;
