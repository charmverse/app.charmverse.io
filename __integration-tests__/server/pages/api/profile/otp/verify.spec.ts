import request from 'supertest';

import { baseUrl, loginOtpUser } from 'testing/mockApiCall';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { createTestUserOtp, generateTestOtpToken } from 'testing/userOtp';

describe('PUT /api/profile/otp/verify - Should return a user profile', () => {
  it('should return a LoggedInUser, responding with 200', async () => {
    const { user } = await generateUserAndSpace();
    const userCookie = await loginOtpUser({ id: user.id, method: 'Google' });
    const { otp } = await createTestUserOtp(user.id);
    const token = generateTestOtpToken(user.username, otp.secret);

    const payload = { authCode: token };

    await request(baseUrl).post('/api/profile/otp/verify').set('Cookie', userCookie).send(payload).expect(200);
  });

  it('should return with 400 if token is invalid', async () => {
    const { user } = await generateUserAndSpace();
    const userCookie = await loginOtpUser({ id: user.id, method: 'Google' });
    const { otp } = await createTestUserOtp(user.id);
    const token = generateTestOtpToken('12345', otp.secret);

    const payload = { authCode: token };

    await request(baseUrl).post('/api/profile/otp/verify').set('Cookie', userCookie).send(payload).expect(200);
  });
});
