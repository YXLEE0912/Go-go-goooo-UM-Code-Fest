const API_BASE_URL = "http://localhost:8000"

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token")
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Network error" }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  },

  async get(endpoint: string) {
    return this.request(endpoint)
  },

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: "DELETE",
    })
  },
}

export const auth = {
  async signup(email: string, password: string, name?: string) {
    return api.post("/auth/signup", { email, password, name })
  },

  async login(email: string, password: string, twoFactorCode?: string) {
    const data = await api.post("/auth/login", { email, password, two_factor_code: twoFactorCode })
    localStorage.setItem("token", data.access_token)
    return data
  },

  async getCurrentUser() {
    return api.get("/auth/users/me")
  },

  async getUserSettings() {
    return api.get("/auth/users/me/settings")
  },

  async updateUserSettings(settings: any) {
    return api.put("/auth/users/me/settings", settings)
  },

  async updateUserProfile(profile: { name?: string; email?: string }) {
    return api.put("/auth/users/me/profile", profile)
  },

  async updatePassword(passwordData: any) {
    return api.put("/auth/users/me/password", passwordData)
  },

  async setup2FA() {
    return api.post("/auth/auth/2fa/setup", {})
  },

  async enable2FA(data: { code: string; secret: string }) {
    return api.post("/auth/auth/2fa/enable", data)
  },

  async disable2FA() {
    return api.post("/auth/auth/2fa/disable", {})
  },

  async request2FARecovery(email: string) {
    return api.post("/auth/auth/2fa/recover/request", { email })
  },

  async confirm2FARecovery(email: string, code: string) {
    return api.post("/auth/auth/2fa/recover/confirm", { email, code })
  },

  async sendTestEmail() {
    return api.post("/auth/test-email", {})
  },

  async chat(message: string, history: { role: string; content: string }[], sessionId?: string) {
    return api.post("/api/chat", { message, history, session_id: sessionId })
  },

  async getChatHistory() {
    return api.get("/api/chat/history")
  },

  async predict(days: number = 7) {
    return api.post("/api/predict", { days })
  },

  async getHistory(days: number = 30, period: string = "Week", monthIndex: number = 0, year: number = 2024) {
    return api.get(`/api/history?days=${days}&period=${period}&month_index=${monthIndex}&year=${year}`)
  },

  async getNews() {
    return api.get("/api/news")
  },

  logout() {
    localStorage.removeItem("token")
  },

  getToken() {
    return localStorage.getItem("token")
  },
}