import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { API_URLS } from '../core/constants/api_urls';

// Token payload interfeysi
interface TokenPayload {
  sub?: string;
  jti?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
  exp?: number;
  iss?: string;
  aud?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userIdSubject = new BehaviorSubject<number | null>(null);
  userId$: Observable<number | null> = this.userIdSubject.asObservable();

  private userRoleSubject = new BehaviorSubject<string | null>(null);
  userRole$: Observable<string | null> = this.userRoleSubject.asObservable();

  private readonly isBrowser: boolean;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.initializeUser();
    }
  }

  public initializeUser(): void {
    const token = this.getToken();
    if (!token) {
      this.userIdSubject.next(null);
      this.userRoleSubject.next(null);
      return;
    }

    if (typeof token !== 'string' || !token.includes('.')) {
      this.signOut();
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.signOut();
        return;
      }

      const payload: TokenPayload = JSON.parse(atob(parts[1]));

      // Issuer va Audience tekshiruvi
      if (payload.iss !== API_URLS.ISSUER || payload.aud !== API_URLS.AUDIENCE) {

        this.signOut();
        return;
      }

      // Token muddati tekshiruvi
      const exp = payload.exp ? Number(payload.exp) : 0;
      const now = Math.floor(Date.now() / 1000);
      if (exp < now) {
        this.signOut();
        return;
      }

      // userId va userRole ni olish
      const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
        ? Number(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'])
        : null;
      const userRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;


      if (this.isBrowser) {
        localStorage.setItem('userId', String(userId));
        localStorage.setItem('userRole', String(userRole));
      }

      this.userIdSubject.next(userId);
      this.userRoleSubject.next(userRole);
    } catch (error) {
      this.signOut();
    }
  }

  setUserId(userId: number | null): void {
    this.userIdSubject.next(userId);
  }

  setUserRole(userRole: string | null): void {
    this.userRoleSubject.next(userRole);
  }

  setRedirectUrl(url: string): void {
    if (this.isBrowser) {
      localStorage.setItem('redirectUrl', url);
    }
  }

  signOut(): void {
    if (this.isBrowser) {
      this.clearToken();
      this.clearRedirectUrl();
    }
    this.userIdSubject.next(null);
    this.userRoleSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.userIdSubject.value !== null;
  }

  hasRole(role: string): boolean {
    return this.userRoleSubject.value === role;
  }

  isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  isUser(): boolean {
    return this.hasRole('User');
  }

  isBusiness(): boolean {
    return this.hasRole('Business');
  }

  getUserId(): number | null {
    return this.userIdSubject.value;
  }

  getUserRole(): string | null {
    return this.userRoleSubject.value;
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem('token', token);
    }
  }

  clearToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
    }
  }

  getRedirectUrl(): string | null {
    return this.isBrowser ? localStorage.getItem('redirectUrl') : null;
  }

  clearRedirectUrl(): void {
    if (this.isBrowser) {
      localStorage.removeItem('redirectUrl');
    }
  }

  getUserName(): string | null {
    const token = this.getToken();
    if (token) {
      try {
        const payload: TokenPayload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null; // Use 'sub' instead of 'name' based on token
      } catch (error) {
        return null;
      }
    }
    return null;
  }

}