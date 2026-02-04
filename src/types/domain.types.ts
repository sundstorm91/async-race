export interface Car {
    id: number;
    name: string;
    color: string; // hex format
}

export interface EngineStatus {
  velocity: number; // скорость (м/с)
  distance: number; // расстояние (метры)
}

export interface DriveResult {
  success: boolean;
}

export interface Winner {
  id: number;
  wins: number;    // количество побед
  time: number;    // лучшее время в секундах
}

export interface RaceParticipant { // Участник гонки ID
  carId: number;
  car: Car;
  status: 'idle' | 'starting' | 'racing' | 'broken' | 'finished' | 'stopped';
  startTime?: number; // timestamp начала
  finishTime?: number; // timestamp финиша
  animationId?: number; // ID анимации для отмены
  position?: number;
  engineData?: {
      velocity: number;
      distance: number;
  },
}

export type RaceStatus = 'idle' | 'preparing' | 'racing' | 'finished'; // статусы гонки, для остлеживания состояния.

export interface RaceWinner {
  car: Car;
  time: number; // время в секундах
};

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export interface SortOptions {
  field: 'id' | 'wins' | 'time';
  order: 'ASC' | 'DESC';
};