export interface UserSession {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
}

export interface TokenPayload {
  userId: number;
}

export interface AuthServiceInterface {
  hashPassword(password: string): Promise<string>;
  comparePasswords(password: string, hash: string): Promise<boolean>;
  generateToken(user: UserSession): Promise<string>;
  verifyToken(token: string): Promise<TokenPayload>;
  createUser(
    username: string,
    email: string | null,
    password: string,
  ): Promise<UserSession>;
  validateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<UserSession | null>;
  findUserByIdentifier(identifier: string): Promise<UserSession | null>;
  updatePassword(userId: number, newPassword: string): Promise<void>;
  createResetToken(identifier: string): Promise<string | null>;
  validateResetToken(token: string): Promise<number | null>;
  clearResetToken(userId: number): Promise<void>;
}


export async function verifyToken(token: string): Promise<TokenPayload> {
  const { authService } = await import("$lib/server/services/auth");
  return authService.verifyToken(token);
}


export const userSelect = {
  id: true,
  username: true,
  email: true,
  isAdmin: true,
} as const;
