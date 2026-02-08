import type { GarageApi, WinnersApi } from "../api"
import type { EventBus } from "../core"
import type { StateManager } from "../core/state-manager"
import { ApiError, type AppState, type Car, type RaceWinner, type SortOptions, type Winner } from "../types"

interface IWinnersService {
  loadWinners(page: number): Promise<void>
  getWinner(id: number): Promise<Winner & { car: Car }>
  addWinner(winner: RaceWinner): Promise<void>
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


  async addWinner(winner: RaceWinner): Promise<void> {
      const data = await this.winnersApi.getWinner(winner.car.id);
      console.log(data.time, data.wins)
      const isExistingWinner = data.time !== null && data.time !== undefined && data.wins !== null && data.wins !== undefined;

      console.log(`isExist - ${isExistingWinner}`)

      if (isExistingWinner) {

          await this.winnersApi.updateWinner(winner.car.id, {
            wins: data.wins + 1,
            time: Math.min(data.time, winner.time)
          })

      } else {

            await this.winnersApi.updateWinner(winner.car.id, {
              wins: 1,
              time: winner.time
          });
      }

      this.loadWinners();

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
      const winnersApi = await this.winnersApi.getWinners();

      const validWinners = winnersApi.cars.filter(winner =>
        winner.wins != null &&
        winner.time != null &&
        winner.wins > 0 &&       // ← дополнительная проверка
        winner.time > 0
    );

      const winnersWithCars = await Promise.all(
        validWinners.map(async(winner) => ({
            ...winner,
            car: await this.garageApi.getCar(winner.id)
        }))
    );

    this.stateManager.setState(prevState => ({
      winners: {
        ...prevState.winners,
        isLoading: false,
        winners: winnersWithCars,

      }
    }))
  }

}