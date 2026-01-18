import type { GarageApi } from "../api"
import { generateCars } from "../contants/generateCars"
import type { EventBus } from "../core"
import type { StateManager } from "../core/state-manager"
import type { AppState, Car } from "../types"

interface IGarageService {
  // Основные методы
  loadCars(page: number): Promise<void>
  createCar(name: string, color: string): Promise<void>
  updateCar(id: number, updates: Partial<Car>): Promise<void>
  deleteCar(id: number): Promise<void>

  // Бизнес-логика
  generateRandomCars(count: number): Promise<void>
  selectCar(car: Car | null): void

  // Вспомогательные
  getSelectedCar(): Car | null
  getTotalPages(): number
}

/**
 *
 *
 * @export
 * @class GarageService
 * @implements {IGarageService}
 */

export class GarageService implements IGarageService {

    constructor(
        private stateManager: StateManager<AppState>,
        private eventBus: EventBus,
        private garageApi: GarageApi,
    ) {}

    async createCar(name: string, color: string): Promise<void> {
        const newCar = await this.garageApi.createCar({ name , color});

        this.stateManager.setState(prevState => ({
            ...prevState,

            garage: {
                ...prevState.garage,
                cars: [...prevState.garage.cars, newCar],
                total: prevState.garage.pagination.total + 1
            }

        }))

        this.eventBus.emit('car:created', newCar);
    }

    async deleteCar(id: number): Promise<void> {
        const deletedCar = await this.garageApi.deleteCar(id);

        this.stateManager.setState(prevState => ({
            ...prevState,
            garage: {
                ...prevState.garage,
                 car: prevState.garage.cars.filter(car => car.id !== id),
            pagination: {
                ...prevState.garage.pagination,
                total: prevState.garage.pagination.total - 1
            }
            }
        }))

        this.eventBus.emit('car:deleted', deletedCar)
    }

    selectCar(car: Car | null): void {

        this.stateManager.setState(prevState => ({
            garage: {
                ...prevState.garage,
                selectedCar: car
            }
        }))

    }


    async generateRandomCars(): Promise<void> {

    // Показываем загрузку
    this.stateManager.setState(prev => ({
        garage: { ...prev.garage, isLoading: true }
    }));

        try {
            const newCars = await Promise.all(
                generateCars.map(data => this.garageApi.createCar(data))
            );

            this.stateManager.setState(prev => ({
                garage: {
                    ...prev.garage,
                    cars: prev.garage.cars.concat(newCars),
                    pagination: {
                        ...prev.garage.pagination,
                        total: prev.garage.pagination.total + newCars.length
                    },
                    isLoading: false
                }
            }));

            this.eventBus.emit('cars:generated', { count: newCars.length });

        } catch (error) {

            this.stateManager.setState(prev => ({
                garage: { ...prev.garage, isLoading: false, error: 'Generation cars is failed' }
            }));

        }
    }

    getSelectedCar(): Car | null {
        return this.stateManager.getState().garage.selectedCar
    }

    getTotalPages(): number {
        return this.stateManager.getState().garage.pagination.totalPages
    }

    async loadCars(page: number = 1): Promise<void> {

        try {

            this.stateManager.setState(prevState => ({
                garage: { ...prevState.garage, isLoading: true, error: null}
            }))

            const { cars, total } = await this.garageApi.getCars(page)

            this.stateManager.setState(prevState => ({
                ...prevState,
                garage: {
                    ...prevState.garage,
                    cars,
                    pagination: {
                        ...prevState.garage.pagination,
                        page,
                        totalPages: Math.ceil(total / prevState.garage.pagination.limit) /* обновление пагинации */
                    },
                    isLoading: false
                }
            }))

            this.eventBus.emit('car:loaded', { cars, total })

        } catch (err) {

            this.stateManager.setState(prevState => ({

                garage: {
                    ...prevState.garage,
                    isLoading: false,
                    error: 'Неудалось загрузить машины'
                }

            }))
        }
    }

    /* async updateCar(id: number, updates: Partial<Car>): Promise<void> {
            if (this.stateManager.getState().garage.selectedCar) {
                await this.garageApi.updateCar(id, this.stateManager.getState().garage.selectedCar)
            }

    } */

}

/* garage: {
    ...prevState.garage,
    cars: [...prevState.garage.cars, newCar],
    pagination: {
        ...prevState.garage.pagination,
        total: prevState.garage.pagination.total + 1
    }
} */