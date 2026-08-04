import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { Employee } from './api.service';

export interface AuthResponse {
  token: string;
  employee: Employee;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';
  private currentUserSubject = new BehaviorSubject<Employee | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('auth_token'));

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

  login(email: string, password?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('current_user', JSON.stringify(res.employee));
          this.tokenSubject.next(res.token);
          this.currentUserSubject.next(res.employee);
        }
      })
    );
  }

  loginAsPersona(employee: Employee): void {
    const syntheticToken = 'Bearer ' + btoa(`${employee.id}:${employee.email}:${Date.now()}`);
    localStorage.setItem('auth_token', syntheticToken);
    localStorage.setItem('current_user', JSON.stringify(employee));
    this.tokenSubject.next(syntheticToken);
    this.currentUserSubject.next(employee);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  hasRole(...roles: string[]): boolean {
    const userRole = this.currentRole;
    return roles.includes(userRole);
  }

  canApprove(): boolean {
    return this.hasRole('MANAGER', 'FINANCE_ADMIN');
  }

  canAuditExpenses(): boolean {
    return this.hasRole('FINANCE_ADMIN', 'MANAGER');
  }

  canManageLogistics(): boolean {
    return this.hasRole('LOGISTICS_COORDINATOR', 'MANAGER');
  }

  canManageRisk(): boolean {
    return this.hasRole('RISK_OFFICER', 'MANAGER');
  }
}
