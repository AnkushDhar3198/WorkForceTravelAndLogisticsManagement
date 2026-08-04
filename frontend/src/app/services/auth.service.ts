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

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  employeeCode: string;
  department: string;
  designation: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';
  private currentUserSubject = new BehaviorSubject<Employee | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('auth_token'));

  // 2FA state (used only for 1-click official login)
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
   * Employee Login (Email + Password) — No 2FA required
   */
  loginWithPassword(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login-employee`, { email, password }).pipe(
      tap((res: AuthResponse) => {
        if (res && res.token) {
          this.persistAuth(res);
        }
      })
    );
  }

  /**
   * Employee Signup
   */
  signup(data: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/signup`, data).pipe(
      tap((res: AuthResponse) => {
        if (res && res.token) {
          this.persistAuth(res);
        }
      })
    );
  }

  /**
   * Step 1: Passkey Verification (for 1-click official login flow)
   */
  loginStep1(email: string, passkey: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login-step1`, { email, passkey }).pipe(
      tap((res: AuthResponse) => {
        if (res && res.requires2FA) {
          this.step1Complete = true;
          this.pendingEmail = res.email;
        }
      })
    );
  }

  /**
   * Step 2: 2FA Verification Code (for 1-click official login flow)
   */
  verify2FA(email: string, twoFactorCode: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/verify-2fa`, { email, twoFactorCode }).pipe(
      tap((res: AuthResponse) => {
        if (res && res.token) {
          this.persistAuth(res);
          this.step1Complete = false;
          this.pendingEmail = '';
        }
      })
    );
  }

  /**
   * Direct 1-Click Login (bypasses manual 2FA — for testing)
   */
  loginDirect(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email }).pipe(
      tap((res: AuthResponse) => {
        if (res && res.token) {
          this.persistAuth(res);
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
    return roles.includes(this.currentRole);
  }

  private persistAuth(res: AuthResponse): void {
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('current_user', JSON.stringify(res.employee));
    this.tokenSubject.next(res.token);
    this.currentUserSubject.next(res.employee);
  }
}
