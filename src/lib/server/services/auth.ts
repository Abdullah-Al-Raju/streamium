import { JWT_SECRET } from "$env/static/private";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "$lib/server/prisma";
import type {
  UserSession,
  TokenPayload,
  AuthServiceInterface,
} from "$lib/types/auth";

function toUserSession(data: any): UserSession {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    isAdmin: Boolean(data.isAdmin),
  };
}

class AuthService implements AuthServiceInterface {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateToken(user: UserSession): Promise<string> {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    return jsonwebtoken.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jsonwebtoken.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  async createUser(
    username: string,
    email: string | null,
    password: string,
  ): Promise<UserSession> {
    const hashedPassword = await this.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        isAdmin: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
      },
    });

    return toUserSession(user);
  }

  async validateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<UserSession | null> {
    const result = await prisma.$queryRaw`
      SELECT id, username, email, "passwordHash", "isAdmin"
      FROM users
      WHERE username = ${usernameOrEmail} OR email = ${usernameOrEmail}
      LIMIT 1
    `;

    const user = Array.isArray(result) ? result[0] : result;
    if (!user) return null;


    const isValid = await this.comparePasswords(password, user.passwordHash);
    if (!isValid) return null;

    const { passwordHash, ...userSession } = user;
    return toUserSession(userSession);
  }

  async findUserByIdentifier(identifier: string): Promise<UserSession | null> {
    const result = await prisma.$queryRaw`
      SELECT id, username, email, "isAdmin"
      FROM users
      WHERE username = ${identifier} OR email = ${identifier}
      LIMIT 1
    `;

    const user = Array.isArray(result) ? result[0] : null;
    return user ? toUserSession(user) : null;
  }

  async updatePassword(userId: number, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async createResetToken(identifier: string): Promise<string | null> {
    const user = await this.findUserByIdentifier(identifier);
    if (!user) return null;

    const resetToken = jsonwebtoken.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExp,
      },
    });

    return resetToken;
  }

  async validateResetToken(token: string): Promise<number | null> {
    try {
      const decoded = jsonwebtoken.verify(token, JWT_SECRET) as { userId: number };

      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          resetToken: token,
          resetTokenExp: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
        },
      });

      return user ? user.id : null;
    } catch {
      return null;
    }
  }

  async clearResetToken(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: null,
        resetTokenExp: null,
      },
    });
  }
}

export const authService = AuthService.getInstance();
