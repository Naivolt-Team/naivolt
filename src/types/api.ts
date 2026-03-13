// API response types

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  msg?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  total?: number;
  page?: number;
  limit?: number;
}
