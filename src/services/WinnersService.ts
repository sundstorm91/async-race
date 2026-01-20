import type { GarageApi, WinnersApi } from "../api"
import type { EventBus } from "../core"
import type { StateManager } from "../core/state-manager"
import { ApiError, type AppState, type Car, type RaceWinner, type SortOptions, type Winner } from "../types"

interface IWinnersService {
  loadWinners(page: number, sort: SortOptions): Promise<void>
  getWinner(id: number): Promise<Winner & { car: Car }>
  addWinner(winner: RaceWinner): Promise<void> // После гонки
  /* updateExistingWinner(id: number, wins: number, time: number) */
  deleteWinner(id: number): Promise<void>
}

/**
 *
 * @export
 * @class WinnerService
 * @implements {IWinnersService}
 */

export class WinnerService implements IWinnersService {
  constructor(
    private stateManager: StateManager<AppState>,
    private eventBus: EventBus,
    private winnersApi: WinnersApi,
    private garageApi: GarageApi,
  )
  {}

  private async updateExistingWinner(id: number, newTime: number) {
        const existing = await this.winnersApi.getWinner(id);
        return this.winnersApi.updateWinner(id, {
            wins: existing.wins + 1,
            time: Math.min(existing.time, newTime)
        });
    }

  async addWinner(winner: RaceWinner): Promise<void> {

     try {

      await this.updateExistingWinner(winner.car.id, winner.time);

      this.eventBus.emit('winner:updated', { winner })
      this.loadWinners();

     } catch (err) {

      /* в дальнейшем посмотреть этот момент! */

      if (err instanceof ApiError && err.status === 404) {

        await this.winnersApi.createWinner({
          id: winner.car.id,
          time: winner.time,
          wins: 1,
        })

        this.eventBus.emit('winner:created', { winner })

        this.loadWinners();

     } else {

        /* Обработать другие кейсы ошибок! */

        console.error('Failed to create winner', err)
        throw err;
     }
  }
    this.loadWinners();
  /* loadWinners! Для обновления UI через сервер - так чище! и логичней */
}

  async getWinner(id: number): Promise<Winner & { car: Car }> {
    const currentWinner = await this.winnersApi.getWinner(id);
    const currentCar = await this.garageApi.getCar(id);

    return {
      ...currentWinner, car: currentCar
    }
  }

  async deleteWinner(id: number): Promise<void> {
      await this.winnersApi.deleteWinner(id);

      this.stateManager.setState(prevState => ({
        winners: {
          ...prevState.winners,
          winners: prevState.winners.winners.filter(winner => winner.id !== id)

        }
      }))
  }

  async loadWinners(page: number = 1): Promise<void> {

      const sort = this.stateManager.getState().winners.sort;

      this.stateManager.setState(prevState => ({
        winners: {...prevState.winners, isLoading: true  }
      }))

      try {

        const { winners: ApiWinners, total } = await this.winnersApi.getWinners(
        page,
        10,
        sort.field,
        sort.order,
      );

      const winnersWithCars = await Promise.all(
        ApiWinners.map(async(winner) => ({
            ...winner,
            car: await this.garageApi.getCar(winner.id)
        }))
      )

      this.stateManager.setState(prevState => ({

        winners: {
          ...prevState.winners,
          isLoading: false,
          winners: winnersWithCars,
          sort,
          pagination: {
            ...prevState.winners.pagination,
            page,
            total,
            totalPages: Math.ceil(total / prevState.winners.pagination.limit)
        },

        }
      }))

      } catch (err) {

          this.stateManager.setState(prev => ({
            winners: {
                ...prev.winners,
                isLoading: false,
                error: 'Failed to load Winners'
            }
        }));

        throw err;

      }

  }

}