export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  /** API mode only. Legacy accounts confirm their address during a grace period. */
  emailVerification?: {
    status: "verified" | "unverified" | "legacy_grace" | "legacy_overdue";
    deadline: string | null;
  };
}

export interface AuthSession {
  user: AuthUser;
  /** Only the local browser demo keeps a token. API sessions live in an HttpOnly cookie. */
  token?: string;
  expiresAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
  /** API mode: account created or already existing — the user must confirm the e-mail first. */
  pendingVerification?: boolean;
  /** Machine-readable error, e.g. "email_unverified". */
  code?: string;
}

export interface AuthProvider {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
}

export type AuthMode = "local" | "api";
