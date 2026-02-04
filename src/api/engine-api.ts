import { ApiError, type EngineStatus } from "../types";
import { BaseApi } from "./base-api";

interface IEngineApi {
  // PATCH /engine?id=X&status=started
  startEngine(id: number): Promise<EngineStatus>;

  // PATCH /engine?id=X&status=stopped
  stopEngine(id: number): Promise<void>;

  // PATCH /engine?id=X&status=drive
  drive(id: number): Promise<{ success: boolean }>;
}
/**
 *
 *
 * @export
 * @class EngineApi
 * @extends {BaseApi}
 * @implements {IEngineApi}
 */

export class EngineApi extends BaseApi implements IEngineApi {
    constructor(baseUrl: string, defaultHeaders?: Record<string, string>) {
        super(baseUrl, defaultHeaders)
    }

    async drive(id: number): Promise<{ success: boolean; }> {

      try {
        await this.patch('/engine', {
          id,
          status: 'drive'
        })

        return { success: true }

      } catch (err) {

        if (err instanceof ApiError && err.status === 500) {
          console.log(`🔧 Машина ${id} сломалась в пути (500 ошибка)`);
            return { success: false }
        }

        throw err;

      }

    }

    async startEngine(id: number): Promise<EngineStatus> {
       return this.patch('/engine', {
        id,
        status: 'started'
       })
    }

    async stopEngine(id: number): Promise<void> {
      return this.patch('/engine', {
        id,
        status: 'stopped'
       })
    }






}
