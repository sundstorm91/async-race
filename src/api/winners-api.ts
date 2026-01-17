import type { Winner } from "../types";

interface WinnersApi {
  // GET /winners?_page=1&_limit=10&_sort=wins&_order=DESC
  getWinners(
    page: number,
    limit: number,
    sort: 'id' | 'wins' | 'time',
    order: 'ASC' | 'DESC'
  ): Promise<{ winners: Winner[]; total: number }>;

  getWinner(id: number): Promise<Winner>;
  createWinner(winner: Omit<Winner, 'id'>): Promise<Winner>;
  updateWinner(id: number, winner: Partial<Winner>): Promise<Winner>;
  deleteWinner(id: number): Promise<void>;
}