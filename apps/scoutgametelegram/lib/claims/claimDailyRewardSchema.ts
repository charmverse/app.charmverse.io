import * as yup from 'yup';

export const claimDailyRewardSchema = yup.object({
  isBonus: yup.boolean(),
  dayOfWeek: yup.number().required()
});
