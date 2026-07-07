import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RuntimeEnvService {
  private config: any = environment;

  get<T = any>(key: string): T {
    return this.config[key] as T;
  }

  getBoolean(key: string): boolean {
    const value = this.config[key];
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === undefined || value === null) {
      return false;
    }
    return value.toString().toLowerCase() === 'true';
  }

  getString(key: string): string {
    const value = this.config[key];
    return value !== undefined && value !== null ? value.toString() : '';
  }

  loadFromJson(env: any): void {
    Object.assign(this.config, {
      baseUrl: env['baseUrl'] || '',
      SSO_LOGIN: this.parseBoolean(env['SSO_LOGIN']),
      AUTHENTICATION_SERVICE: this.parseBoolean(env['AUTHENTICATION_SERVICE']),
      CENTRAL_LOGIN_URL: env['CENTRAL_LOGIN_URL'] || '',
      CENTRAL_API_URL: env['CENTRAL_API_URL'] || '',
      MAP_URL: env['MAP_URL'] || '',
      RETROS_URL: env['RETROS_URL'] || '',
      SPEED_SUITE: this.parseBoolean(env['SPEED_SUITE']),
      MCP_URL: env['MCP_URL'] || '',
    });
  }

  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === undefined || value === null) {
      return false;
    }
    return value.toString().toLowerCase() === 'true';
  }
}
