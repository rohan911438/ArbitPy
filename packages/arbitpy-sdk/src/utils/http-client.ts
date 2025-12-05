// HTTP Client utility for ArbitPy SDK
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ArbitPyConfig } from '../types';

export class HttpClient {
  private client: AxiosInstance;
  private config: ArbitPyConfig;

  constructor(config: ArbitPyConfig) {
    this.config = {
      apiUrl: 'http://localhost:5000/api/v1',
      timeout: 30000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && {
          Authorization: `Bearer ${this.config.apiKey}`,
        }),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp to prevent caching
        config.params = {
          ...config.params,
          _t: Date.now(),
        };
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Invalid API key or session expired');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please check your connection.');
        }
        throw new Error(
          error.response?.data?.message || error.message || 'Request failed'
        );
      }
    );
  }

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  // Utility methods
  setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
    this.client.defaults.headers.common.Authorization = `Bearer ${apiKey}`;
  }

  setBaseURL(url: string) {
    this.config.apiUrl = url;
    this.client.defaults.baseURL = url;
  }

  setTimeout(timeout: number) {
    this.config.timeout = timeout;
    this.client.defaults.timeout = timeout;
  }

  getConfig(): ArbitPyConfig {
    return { ...this.config };
  }
}