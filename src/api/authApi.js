import client from './client';

export const loginAdmin = async (email, password) => {
  const res = await client.post('/auth/login', { email, password });
  return res?.data || res;
};

export const getAuthProfile = async () => {
  const res = await client.get('/auth/me');
  return res?.data?.user || res?.data || res;
};
