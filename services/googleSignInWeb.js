// Web-specific Google Sign-In implementation
// This uses the Google Identity Services library for web

class GoogleSignInWeb {
  constructor() {
    this.isInitialized = false;
    this.user = null;
    this.accessToken = null;
  }

  async configure(config) {
    console.log("[GoogleSignInWeb] Configuring for web...");
    this.config = config;

    // Load Google Identity Services
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) {
        this.isInitialized = true;
        console.log("[GoogleSignInWeb] Google Identity Services already loaded");
        resolve();
        return;
      }

      // Load Google Identity Services
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isInitialized = true;
        console.log("[GoogleSignInWeb] Google Identity Services loaded");
        resolve();
      };
      script.onerror = () => {
        console.error("[GoogleSignInWeb] Failed to load Google Identity Services");
        reject(new Error("Failed to load Google Identity Services"));
      };
      document.head.appendChild(script);
    });
  }

  async signIn() {
    if (!this.isInitialized) {
      throw new Error("Google Sign-In not initialized");
    }

    console.log("[GoogleSignInWeb] Starting real Google Sign-In process...");
    console.log("[GoogleSignInWeb] Web Client ID:", this.config.webClientId);
    console.log("[GoogleSignInWeb] Redirect URI:", window.location.origin);
    console.log("[GoogleSignInWeb] Current URL:", window.location.href);

    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.accounts) {
        reject(new Error("Google Identity Services not available"));
        return;
      }

      // Use implicit flow instead of authorization code flow
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: this.config.webClientId,
        scope: this.config.scopes?.join(" ") || "openid email profile",
        callback: (response) => {
          if (response.access_token) {
            this.accessToken = response.access_token;

            // Get user info using the access token
            this.getUserInfo(response.access_token)
              .then((userInfo) => {
                this.user = {
                  user: userInfo,
                };
                console.log("[GoogleSignInWeb] Real sign-in successful:", this.user);
                resolve(this.user);
              })
              .catch(reject);
          } else {
            reject(new Error("Sign-in failed"));
          }
        },
      });

      client.requestAccessToken();
    });
  }

  async getUserInfo(accessToken) {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
      const userInfo = await response.json();
      console.log("[GoogleSignInWeb] User info retrieved:", userInfo);
      return userInfo;
    } catch (error) {
      console.error("[GoogleSignInWeb] Error getting user info:", error);
      throw error;
    }
  }

  async exchangeCodeForTokens(code) {
    // This would typically be done on your backend
    // For demo purposes, we'll use a mock implementation
    console.log("[GoogleSignInWeb] Exchanging code for tokens:", code);

    // In a real app, you'd make a request to your backend
    // For now, we'll return mock tokens
    return {
      access_token: "mock_access_token_" + Date.now(),
      id_token: "mock_id_token_" + Date.now(),
      expires_in: 3600,
    };
  }

  parseJWT(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("[GoogleSignInWeb] Error parsing JWT:", error);
      return {};
    }
  }

  async getTokens() {
    return {
      accessToken: this.accessToken,
      idToken: "mock_id_token_" + Date.now(),
    };
  }

  async signOut() {
    this.user = null;
    this.accessToken = null;
    console.log("[GoogleSignInWeb] Signed out");
  }

  async isSignedIn() {
    return !!this.user;
  }

  async getCurrentUser() {
    return this.user;
  }

  async hasPlayServices() {
    return true; // Always available on web
  }
}

export default new GoogleSignInWeb();
