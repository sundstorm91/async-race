import type { Winner } from "../types";
import { BaseApi } from "./base-api";

interface IWinnersApi {
  // GET /winners?_page=1&_limit=10&_sort=wins&_order=DESC
  getWinners(
    page: number,
    limit: number,
    sort: 'id' | 'wins' | 'time',
    order: 'ASC' | 'DESC'
  ): Promise<{ cars: Winner[]; total: number }>;

  getWinner(id: number): Promise<Winner>;
  createWinner(winner: Omit<Winner, 'id'>): Promise<Winner>;
  updateWinner(id: number, winner: Partial<Winner>): Promise<Winner>;
  deleteWinner(id: number): Promise<void>;
}
/**
 *
 *
 * @export
 * @class WinnersApi
 * @extends {baseApi}
 * @implements {IWinnersApi}
 */

export class WinnersApi extends BaseApi implements IWinnersApi {
    constructor(baseUrl: string, defaultHeaders?: Record<string, string>) {
      super(baseUrl, defaultHeaders)
    }

    createWinner(winner: Winner): Promise<Winner> {
      return this.post('/winners', winner )
    }

    deleteWinner(id: number): Promise<void> {
      return this.delete(`/winners/${id}`)
    }

    getWinner(id: number): Promise<Winner> {
       return this.get(`/winners/${id}`)
    }

    getWinners(page?: number, limit?: number, sort: "id" | "wins" | "time" = 'id', order: "ASC" | "DESC" = 'ASC'): Promise<{ cars: Winner[]; total: number; }> {
      return this.get(`/winners`, {
        _page: page,
        _limit: limit,
        _sort: sort,
        _order: order,
      })
    }

    updateWinner(id: number, winner: Partial<Winner>): Promise<Winner> {
       return this.put(`/winners/${id}`, winner)
    }
}