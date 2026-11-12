import type { Request, Response } from 'express';

import { getAuthUserId } from '../../middleware/auth.js';
import { getValidated } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { LoginBody, RegisterBody } from './schema.js';
import { getCurrentUser, loginUser, registerUser } from './service.js';

export const registerController = asyncHandler(
  async (_req: Request, res: Response) => {
    const { body } = getValidated<RegisterBody>(res);
    const result = await registerUser(body);
    res.status(201).json({ data: result });
  },
);

export const loginController = asyncHandler(
  async (_req: Request, res: Response) => {
    const { body } = getValidated<LoginBody>(res);
    const result = await loginUser(body);
    res.status(200).json({ data: result });
  },
);

export const meController = asyncHandler(
  async (_req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    const result = await getCurrentUser(userId);
    res.status(200).json({ data: result });
  },
);
