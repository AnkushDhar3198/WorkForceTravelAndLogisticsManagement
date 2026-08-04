import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Employee } from './api.service';

export interface AuthResponse {
  token: string;
  employee: Employee;
  message: string;
  requires2FA: boolean;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';
  private currentUserSubject = new BehaviorSubject<Employee | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('auth_token'));

  // 2FA state
  public step1Complete = false;
  public pendingEmail = '';

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('current_user');
      }
    }
  }

  public get currentUserValue(): Employee | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  public get currentRole(): string {
    return this.currentUserSubject.value?.role || 'GUEST';
  }

  /**
   * Step 1: Passkey Verification
   */
  loginStep1(email: string, passkey: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login-step1`, { email, passkey }).pipe(
      tap(res => {
        if (res && res.requires2FA) {
          this.step1Complete = true;
          this.pendingEmail = res.email;
        }
      })
    );
  }

  /**
   * Step 2: 2FA Verification Code
   */
  verify2FA(email: string, twoFactorCode: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/verify-2fa`, { email, twoFactorCode }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('current_user', JSON.stringify(res.employee));
          this.tokenSubject.next(res.token);
          this.currentUserSubject.next(res.employee);
          this.step1Complete = false;
          this.pendingEmail = '';
        }
      })
    );
  }

  /**
   * Direct 1-Click Login for Official Testing
   */
  loginDirect(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('current_user', JSON.stringify(res.employee));
          this.tokenSubject.next(res.token);
          this.currentUserSubject.next(res.employee);
          this.step1Complete = false;
          this.pendingEmail = '';
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.step1Complete = false;
    this.pendingEmail = '';
  }

  hasRole(...roles: string[]): boolean {
    const userRole = this.currentRole;
    return roles.includes(userRole);
  }
}
