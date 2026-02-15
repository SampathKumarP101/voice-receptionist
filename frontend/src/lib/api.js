const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Appointments
  async getAppointments(clinicId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/appointments/${clinicId}?${queryString}`);
  }

  async createAppointment(clinicId, data) {
    return this.request(`/api/appointments/${clinicId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelAppointment(appointmentId, reason) {
    return this.request(`/api/appointments/${appointmentId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  async getAvailableSlots(clinicId, date) {
    return this.request(`/api/appointments/${clinicId}/slots?date=${date}`);
  }

  // Call Logs
  async getCallLogs(clinicId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/call-logs/${clinicId}?${queryString}`);
  }

  // Health
  async getHealth() {
    return this.request('/health');
  }
}

export const api = new ApiClient();
