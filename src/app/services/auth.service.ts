import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

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

  private initializeUser(): void {
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
        if (payload.iss !== 'http://localhost:5251' || payload.aud !== 'http://localhost:5251') {
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

  signOut(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
    }
    this.userIdSubject.next(null);
    this.userRoleSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return !!localStorage.getItem('token');
  }
}