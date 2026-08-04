import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'midnight' | 'daylight' | 'cosmic';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<ThemeMode>(
    (localStorage.getItem('app_theme') as ThemeMode) || 'midnight'
  );
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.applyTheme(this.currentThemeSubject.value);
  }

  public get theme(): ThemeMode {
    return this.currentThemeSubject.value;
  }

  setTheme(theme: ThemeMode): void {
    localStorage.setItem('app_theme', theme);
    this.currentThemeSubject.next(theme);
    this.applyTheme(theme);
  }

  toggleNextTheme(): void {
    const modes: ThemeMode[] = ['midnight', 'daylight', 'cosmic'];
    const nextIndex = (modes.indexOf(this.theme) + 1) % modes.length;
    this.setTheme(modes[nextIndex]);
  }

  private applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;
    root.classList.remove('theme-midnight', 'theme-daylight', 'theme-cosmic');
    root.classList.add(`theme-${theme}`);
  }
}
