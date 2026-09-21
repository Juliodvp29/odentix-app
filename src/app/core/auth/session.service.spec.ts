import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';

function stubStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  });
  return store;
}

describe('SessionService', () => {
  beforeEach(() => {
    stubStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should start logged out with empty storage', () => {
    const service = TestBed.inject(SessionService);
    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should persist the session and report authenticated', () => {
    const service = TestBed.inject(SessionService);
    service.setSession('access-123', 'refresh-123');
    expect(service.accessToken()).toBe('access-123');
    expect(service.refreshToken()).toBe('refresh-123');
    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('odentix.accessToken')).toBe('access-123');
    expect(localStorage.getItem('odentix.refreshToken')).toBe('refresh-123');
  });

  it('should restore the session from storage', () => {
    localStorage.setItem('odentix.accessToken', 'stored-access');
    localStorage.setItem('odentix.refreshToken', 'stored-refresh');
    const service = TestBed.inject(SessionService);
    expect(service.accessToken()).toBe('stored-access');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should clear the session', () => {
    const service = TestBed.inject(SessionService);
    service.setSession('access-123', 'refresh-123', { email: 'admin@odentix.co' });
    service.clearSession();
    expect(service.accessToken()).toBeNull();
    expect(service.refreshToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('odentix.accessToken')).toBeNull();
    expect(localStorage.getItem('odentix.currentUser')).toBeNull();
  });

  it('should persist and restore the current user', () => {
    const seeded = TestBed.inject(SessionService);
    seeded.setSession('access-123', 'refresh-123', { email: 'admin@odentix.co' });
    expect(seeded.currentUser()?.email).toBe('admin@odentix.co');
    expect(localStorage.getItem('odentix.currentUser')).toContain('admin@odentix.co');
  });

  it('should rotate tokens while keeping the current user', () => {
    const service = TestBed.inject(SessionService);
    service.setSession('old-access', 'old-refresh', { email: 'admin@odentix.co' });
    service.updateTokens('new-access', 'new-refresh');
    expect(service.accessToken()).toBe('new-access');
    expect(service.refreshToken()).toBe('new-refresh');
    expect(service.currentUser()?.email).toBe('admin@odentix.co');
    expect(service.isAuthenticated()).toBe(true);
  });
});
