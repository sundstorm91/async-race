// "бочко-образный экспорт файлов"

export * from './domain.types';
export * from './api.types';
export * from './state.types';
export * from './ui.types';

// Re-export часто используемых типов с алиасами
export type { Car, Winner, EngineStatus, RaceWinner } from './domain.types';
export type { AppState, GarageState, RaceState, WinnersState } from './state.types';
export type { ButtonProps, InputProps, CarProps } from './ui.types';