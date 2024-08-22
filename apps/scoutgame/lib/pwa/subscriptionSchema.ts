import * as yup from 'yup';

export const saveSubscriptionSchema = yup.object().shape({
  subscription: yup
    .object()
    .shape({
      endpoint: yup.string().required(),
      expirationTime: yup.number().nullable(),
      options: yup
        .object()
        .shape({
          applicationServerKey: yup.mixed<any>().nullable(),
          userVisibleOnly: yup.bool()
        })
        .optional()
    })
    .required()
});
