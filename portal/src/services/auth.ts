// portal/src/services/auth.ts
import Keycloak from "keycloak-js";

const keycloakConfig = {
  url: window.location.origin + "/auth",
  realm: "knowledge-platform",
  clientId: "portal",
};

const keycloak = new Keycloak(keycloakConfig);

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  roles: string[];
  groups: string[];
}

export class AuthService {
  private initialized = false;
  private userInfo: UserInfo | null = null;

  async init(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      const authenticated = await keycloak.init({
        onLoad: "check-sso",
        pkceMethod: "S256",
      });

      if (authenticated && keycloak.tokenParsed) {
        this.userInfo = {
          id: keycloak.tokenParsed.sub,
          name:
            keycloak.tokenParsed.name ||
            keycloak.tokenParsed.preferred_username ||
            "",
          email: keycloak.tokenParsed.email || "",
          roles: keycloak.tokenParsed.realm_access?.roles || [],
          groups: keycloak.tokenParsed.groups || [],
        };
      }

      this.initialized = true;
      return authenticated;
    } catch (error) {
      console.error("Failed to initialize Keycloak:", error);
      return false;
    }
  }

  async login(): Promise<void> {
    await keycloak.login();
  }

  async logout(): Promise<void> {
    await keycloak.logout({ redirectUri: window.location.origin });
  }

  getToken(): string | undefined {
    return keycloak.token;
  }

  getUserInfo(): UserInfo | null {
    return this.userInfo;
  }

  isAuthenticated(): boolean {
    return !!keycloak.authenticated;
  }

  hasRole(role: string): boolean {
    return this.userInfo?.roles.includes(role) || false;
  }
}

export const authService = new AuthService();
