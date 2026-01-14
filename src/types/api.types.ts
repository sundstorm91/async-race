export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface GetWinnersParams {
  page?: number;
  limit?: number;
  sort?: 'id' | 'wins' | 'time';
  order?: 'ASC' | 'DESC';
}

export interface EngineParams {
  id: number;
  status: 'started' | 'stopped' | 'drive';
}

// Ошибки API
export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}

export interface EngineError extends ApiError {
  carId: number;
}