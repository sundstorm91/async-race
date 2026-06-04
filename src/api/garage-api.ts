import type { Car } from "../types";
import { BaseApi } from "./base-api";

interface IGarageApi {
    getCars(page: number, limit: number):Promise<{cars: Car[]; total: number}>

    getCar(id: number): Promise<Car>;

    createCar(car: Omit<Car, 'id'>): Promise<Car>;

    updateCar(id: number, car: Partial<Car>): Promise<Car>;

    deleteCar(id: number):Promise<void>;
};
/**
 *
 *
 * @export
 * @class GarageApi
 * @extends {BaseApi}
 * @implements {IGarageApi}
 */


export class GarageApi extends BaseApi implements IGarageApi {

    constructor(baseUrl: string, defaultHeaders?: Record<string, string>) {
        super(baseUrl, defaultHeaders)
    }

    async getCars(page: number = 1, limit: number = 7) {
        return this.get<{ cars: Car[]; total: number }>('/garage', {
            _page: page,
            _limit: limit
        });
    // handleResponse сам добавит total из заголовка
    }

    createCar(car: Omit<Car, "id">): Promise<Car> {
        return this.post('/garage', car)
    }

    getCar(id: number): Promise<Car> {
        return this.get(`/garage/${id}`)
    }

    updateCar(id: number, car: Partial<Car>): Promise<Car> {
        return this.put(`/garage/${id}`, car)
    }

    deleteCar(id: number): Promise<void> {
        return this.delete(`/garage/${id}`)
    }
}

