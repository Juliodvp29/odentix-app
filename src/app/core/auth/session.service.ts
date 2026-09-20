import { Injectable, computed, signal } from '@angular/core';

const ACCESS_TOKEN_KEY = 'odentix.accessToken';
const REFRESH_TOKEN_KEY = 'odentix.refreshToken';

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
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  setSession(accessToken: string, refreshToken: string): void {
    this.storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    this.storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    this.accessToken.set(accessToken);
    this.refreshToken.set(refreshToken);
  }

  clearSession(): void {
    this.storage.removeItem(ACCESS_TOKEN_KEY);
    this.storage.removeItem(REFRESH_TOKEN_KEY);
    this.accessToken.set(null);
    this.refreshToken.set(null);
  }
}
