export type AuthUser = {
  id: number;
  username: string;
  email: string;
  kueId?: string | null;
  bio?: string | null;
  avatarId?: string | null;
  roles: string[];
  termsVersion?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string | null;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  user: AuthUser;
};

export type ApiErrorBody = {
  message?: string;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
