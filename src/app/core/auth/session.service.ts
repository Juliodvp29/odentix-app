import { Injectable, computed, signal } from '@angular/core';
import { components } from '@core/api/schema';

export type CurrentUser = components['schemas']['UserSummaryDto'];

const ACCESS_TOKEN_KEY = 'odentix.accessToken';
const REFRESH_TOKEN_KEY = 'odentix.refreshToken';
const USER_KEY = 'odentix.currentUser';

interface TokenStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function resolveStorage(): TokenStorage {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.getItem('odentix.storage.probe');
      return localStorage;
    }
  } catch {
    // Storage blocked (private mode) — fall through to memory below.
  }
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
    removeItem: (key) => {
      memory.delete(key);
    },
  };
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storage = resolveStorage();

  readonly accessToken = signal<string | null>(this.storage.getItem(ACCESS_TOKEN_KEY));
  readonly refreshToken = signal<string | null>(this.storage.getItem(REFRESH_TOKEN_KEY));
  readonly currentUser = signal<CurrentUser | null>(readUser(this.storage));
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  setSession(accessToken: string, refreshToken: string, user: CurrentUser | null = null): void {
    this.storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    this.storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (user) {
      this.storage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      this.storage.removeItem(USER_KEY);
    }
    this.accessToken.set(accessToken);
    this.refreshToken.set(refreshToken);
    this.currentUser.set(user);
  }

  clearSession(): void {
    this.storage.removeItem(ACCESS_TOKEN_KEY);
    this.storage.removeItem(REFRESH_TOKEN_KEY);
    this.storage.removeItem(USER_KEY);
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.currentUser.set(null);
  }
}

function readUser(storage: TokenStorage): CurrentUser | null {
  try {
    const raw = storage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}
