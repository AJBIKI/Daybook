import { apiClient } from '../../lib/apiClient';
import type { ApiSuccess } from '../../types/api';
import type {
  AuthPayload,
  LoginInput,
  RegisterInput,
  User,
} from '../../types/auth';

export async function registerRequest(input: RegisterInput): Promise<AuthPayload> {
  const res = await apiClient.post<ApiSuccess<AuthPayload>>(
    '/auth/register',
    input,
  );
  return res.data.data;
}

export async function loginRequest(input: LoginInput): Promise<AuthPayload> {
  const res = await apiClient.post<ApiSuccess<AuthPayload>>(
    '/auth/login',
    input,
  );
  return res.data.data;
}

export async function fetchMeRequest(): Promise<User> {
  const res = await apiClient.get<ApiSuccess<{ user: User }>>('/auth/me');
  return res.data.data.user;
}
