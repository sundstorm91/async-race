import type { Car, Pagination, RaceParticipant, RaceStatus, RaceWinner, SortOptions, Winner } from "./domain.types";

export interface GarageState {
  cars: Car[];
  selectedCar: Car | null;
  pagination: Pagination;
  isLoading: boolean;
  error: string | null;
}

export interface RaceState {
  status: RaceStatus;
  participants: RaceParticipant[];
  winner: RaceWinner | null;
  results: Array<{
    carId: number;
    time: number;
    success: boolean;
  }>;
}

export interface WinnersState {
  winners: Array<Winner & { car: Car }>; // Winner с полной информацией о машине
  pagination: Pagination;
  sort: SortOptions;
  isLoading: boolean;
}

export interface UIState {
  activeView: 'garage' | 'winners';
  modals: {
    winner: {
      isOpen: boolean;
      data: RaceWinner | null;
    };
    createCar: boolean;
    updateCar: boolean;
  };
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    timeout: number;
  }>;
}

export interface AppState {
  garage: GarageState;
  race: RaceState;
  winners: WinnersState;
  ui: UIState;
}


// Начальное состояние
export const initialState: AppState = {
  garage: {
    cars: [],
    selectedCar: null,
    pagination: { page: 1, limit: 7, total: 0, totalPages: 0 },
    isLoading: false,
    error: null
  },
  race: {
    status: 'idle',
    participants: [],
    winner: null,
    results: []
  },
  winners: {
    winners: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    sort: { field: 'wins', order: 'DESC' },
    isLoading: false
  },
  ui: {
    activeView: 'garage',
    modals: {
      winner: { isOpen: false, data: null },
      createCar: false,
      updateCar: false
    },
    notifications: []
  }
};