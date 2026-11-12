import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import {
  toPublicUser,
  UserModel,
  type PublicUser,
} from '../users/model.js';
import type { LoginBody, RegisterBody } from './schema.js';

const BCRYPT_COST = 12;
// Precomputed cost-12 hash used when an account does not exist to keep login timing uniform.
const DUMMY_PASSWORD_HASH =
  '$2b$12$C6UzMDM.H6dfI/f/IKcEeO6v7bC0T6nR4xK2r0e5iL0d5d3O5n8uW';

export interface AuthResult {
  user: PublicUser;
  token: string;
}

function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export async function registerUser(input: RegisterBody): Promise<AuthResult> {
  const existing = await UserModel.findOne({ email: input.email }).lean();
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  const publicUser = toPublicUser(user);
  return {
    user: publicUser,
    token: signAccessToken(publicUser.id),
  };
}

export async function loginUser(input: LoginBody): Promise<AuthResult> {
  const user = await UserModel.findOne({ email: input.email });

  if (!user) {
    await bcrypt.compare(input.password, DUMMY_PASSWORD_HASH);
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const publicUser = toPublicUser(user);
  return {
    user: publicUser,
    token: signAccessToken(publicUser.id),
  };
}

export async function getCurrentUser(userId: string): Promise<{ user: PublicUser }> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Account not found');
  }

  return {
    user: toPublicUser(user),
  };
}
