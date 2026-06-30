export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
  requestId: string;
}

class ApiClient {
  private getBaseUrl() {
    return 'http://localhost:3001/api/v1';
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Dynamically retrieve current session token from local storage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('heirloom_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  public async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `API GET request failed with status: ${response.status}`);
    }
    return result;
  }

  public async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `API POST request failed with status: ${response.status}`);
    }
    return result;
  }

  public async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `API PUT request failed with status: ${response.status}`);
    }
    return result;
  }

  public async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `API DELETE request failed with status: ${response.status}`);
    }
    return result;
  }
}

export const api = new ApiClient();
