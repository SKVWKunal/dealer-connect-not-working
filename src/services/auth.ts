/**
 * Authentication Service
 * 
 * Handles user authentication, session management, and role-based access.
 * Uses localStorage for prototype; ready for Supabase Auth migration.
 */

import { User, UserRole } from '@/types';
import { configStorage, userStorage } from './storage';
import { auditService } from './audit';

const SESSION_KEY = 'current_session';

interface Session {
  user: User;
  token: string;
  expiresAt: string;
}

interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
  requiresOTP?: boolean;
}

class AuthService {
  private session: Session | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    const sessionData = configStorage.get<Session>(SESSION_KEY);
    if (sessionData) {
      const expiresAt = new Date(sessionData.expiresAt);
      if (expiresAt > new Date()) {
        this.session = sessionData;
      } else {
        this.clearSession();
      }
    }
  }

  private saveSession(session: Session): void {
    this.session = session;
    configStorage.set(SESSION_KEY, session);
  }

  private clearSession(): void {
    this.session = null;
    configStorage.remove(SESSION_KEY);
  }

  private generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  async login(email: string, password: string): Promise<LoginResult> {
    // Find user by email
    const users = await userStorage.getAll();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // In prototype, we use a simple password check
    // In production, this would verify against hashed passwords
    const storedPassword = configStorage.get<string>(`password_${user.id}`);
    if (storedPassword !== password) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Account is deactivated' };
    }

    // Check if OTP is required (Admin/Super Admin)
    if (user.role === 'admin' || user.role === 'super_admin') {
      // Store pending login for OTP verification
      configStorage.set('pending_login', { userId: user.id, timestamp: Date.now() });
      return { success: true, requiresOTP: true };
    }

    // Create session
    const session: Session = {
      user,
      token: this.generateToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    this.saveSession(session);

    // Update last login
    await userStorage.update(user.id, { lastLoginAt: new Date().toISOString() });

    // Log audit
    await auditService.log({
      userId: user.id,
      userEmail: user.email,
      role: user.role,
      module: 'auth',
      action: 'login',
      notes: 'User logged in successfully'
    });

    return { success: true, user };
  }

  async verifyOTP(otp: string): Promise<LoginResult> {
    const pendingLogin = configStorage.get<{ userId: string; timestamp: number }>('pending_login');
    
    if (!pendingLogin || Date.now() - pendingLogin.timestamp > 5 * 60 * 1000) {
      return { success: false, error: 'OTP expired. Please login again.' };
    }

    // In prototype, accept any 6-digit OTP
    if (!/^\d{6}$/.test(otp)) {
      return { success: false, error: 'Invalid OTP format' };
    }

    const user = await userStorage.getById(pendingLogin.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Create session
    const session: Session = {
      user,
      token: this.generateToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    this.saveSession(session);
    configStorage.remove('pending_login');

    await userStorage.update(user.id, { lastLoginAt: new Date().toISOString() });

    await auditService.log({
      userId: user.id,
      userEmail: user.email,
      role: user.role,
      module: 'auth',
      action: 'login',
      notes: 'User logged in with OTP verification'
    });

    return { success: true, user };
  }

  async logout(): Promise<void> {
    if (this.session) {
      await auditService.log({
        userId: this.session.user.id,
        userEmail: this.session.user.email,
        role: this.session.user.role,
        module: 'auth',
        action: 'logout',
        notes: 'User logged out'
      });
    }
    this.clearSession();
  }

  getCurrentUser(): User | null {
    return this.session?.user || null;
  }

  isAuthenticated(): boolean {
    return this.session !== null;
  }

  hasRole(roles: UserRole | UserRole[]): boolean {
    if (!this.session) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(this.session.user.role);
  }

  isDealer(): boolean {
    return this.hasRole(['master_technician', 'service_manager', 'service_head', 'warranty_manager']);
  }

  isManufacturer(): boolean {
    return this.hasRole(['admin', 'super_admin']);
  }

  isSuperAdmin(): boolean {
    return this.hasRole('super_admin');
  }
}

export const authService = new AuthService();
