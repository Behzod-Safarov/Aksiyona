import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { API_URLS } from '../core/constants/api_urls';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userIdSubject = new BehaviorSubject<number | null>(null);
  userId$: Observable<number | null> = this.userIdSubject.asObservable();

  private userRoleSubject = new BehaviorSubject<string | null>(null);
  userRole$: Observable<string | null> = this.userRoleSubject.asObservable();

  private isBrowser: boolean;

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
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token); // Debug the token value
    if (token && typeof token === 'string' && token.includes('.')) {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error('Invalid token format: Expected 3 parts (header.payload.signature)', parts);
          this.signOut();
          return;
        }

        const payload = JSON.parse(atob(parts[1]));
        // Validate issuer and audience for local server
        if (payload.iss !== API_URLS.BASE_URL || payload.aud !== API_URLS.BASE_URL) {
          console.error('Invalid token: Issuer or Audience mismatch');
          this.signOut();
          return;
        }

        // Check token expiration
        const exp = payload.exp ? Number(payload.exp) : 0;
        const now = Math.floor(Date.now() / 1000);
        if (exp < now) {
          console.error('Token expired');
          this.signOut();
          return;
        }

        // Extract userId from the token
        const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
          ? Number(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'])
          : null;
          const userRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
          ? String(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])
          : null;

        console.log('Extracted userId:', userId);
        console.log('Extracted UserRole:', userRole);
        localStorage.setItem('userId', String(userId)); // Store userId in localStorage for debugging
        localStorage.setItem('userRole', String(userRole)); // Store userRole in localStorage for debugging
        
        this.userIdSubject.next(userId);
        this.userRoleSubject.next(userRole);
      } catch (error) {
        console.error('Error decoding token:', error);
        this.signOut();
      }
    } else {
      console.warn('No valid token found in localStorage');
      this.userIdSubject.next(null);
      this.userRoleSubject.next(null);
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
      localStorage.removeItem('token');
    }
    this.userIdSubject.next(null);
    this.userRoleSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.userIdSubject.value !== null;
  }
  isAdmin(): boolean {
    return this.userRoleSubject.value === 'Admin';
  }
  isUser(): boolean {
    return this.userRoleSubject.value === 'User';
  }
  isBusiness(): boolean {
    return this.userRoleSubject.value === 'Business';
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
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || null;
    }
    return null;
  }
}