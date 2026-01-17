import type { Car } from "../types";

interface GarageApi {
    getCars(page: number, limit: number):Promise<{cars: Car[]; total: number}>

    getCar(id: number): Promise<Car>;

    createCar(car: Omit<Car, 'id'>): Promise<Car>;

    updateCar(id: number, car: Partial<Car>): Promise<Car>;

    deleteCar(id: number):Promise<void>;
};

