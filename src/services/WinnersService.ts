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
      console.log('🏁 addWinner для car:', winner.car.id, 'time:', winner.time);

      try {
         console.log('1. Ищем существующего...');
        const existing = await this.winnersApi.getWinner(winner.car.id);
        console.log('2. Нашли:', existing);
        console.log('3. Текущие wins:', existing.wins, 'тип:', typeof existing.wins);

        /*

        Аномалия! - от сервера приходят данные на обновление - только undefined. Почему так? Это сервер - логика неправильная.
        Вариант - изменить лоигку сервера / научиться работать с API, Даже багованным. Сделать костыль! о даа..

        Данный флоу перезаписывает время исправно , то Wins - зависает потому что она 0 всегда и прибавляет += 1 - получается
        бесконечная единица

        В целом флоу рабочий, но неправильный если касается поля wins

        */
        // ЗАЩИТА ОТ NULL!
        const currentWins = existing.wins || 0;  // если null/undefined → 0
        const currentTime = existing.time || Infinity;  // если null → Infinity

        console.log('currentWins после защиты:', currentWins);
        console.log('new wins для update:', currentWins + 1);

        await this.winnersApi.updateWinner(winner.car.id, {
          wins: currentWins + 1,
          time: Math.min(currentTime, winner.time)
        });

      } catch (err: any) {

        if (err?.status === 404) {
          // Создаем нового
          if (winner.time === undefined || winner.time === null) {

            console.error('⛔ Некорректное время победителя:', winner);

            throw new Error('Winner time is invalid');
          }

          console.log('создаем нового...')

          console.log('📤 createWinner отправляет:', {
            id: winner.car.id,
            wins: 1,
            time: winner.time
          });
          await this.winnersApi.createWinner({
            id: winner.car.id,
            wins: 1,
            time: winner.time
          });

          console.log('успешно создали..')
        } else {
          console.log('вылезла ошибка при создании..')
          throw err;
        }

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

  async loadWinners(): Promise<void> {
      const winnersApi = await this.winnersApi.getWinners();
      console.log('Получили ответ winnersApi - ', winnersApi.cars)

      console.log('Доп проверка на ошибки...')
      const validWinners = winnersApi.cars.filter(winner =>
        winner.wins != null &&
        winner.time != null &&
        winner.wins > 0 &&       // ← дополнительная проверка
        winner.time > 0
    );
      console.log('Проверка прошла..')

      console.log('формируем winnersWithCars')

        interface CarResponse {
        cars: Car;
        total: number;
    }

    interface WinnerWithCar {
        id: number;
        wins: number;
        time: number;
        car: Car;  // ← нам нужен именно Car, не CarResponse
    }

      const winnersWithCars = await Promise.all(


        validWinners.map(async(winner) => {

            try {
                const carResponse = await this.garageApi.getCar(winner.id) as unknown as CarResponse;
                const car = carResponse.cars;

                return { ...winner, car };
            } catch (err) {
                console.error(`Car ${winner.id} not loaded:`, err);
                return { ...winner, car: null }; // ← явный null
            }

        })

    );
    const valid = winnersWithCars.filter(w => w.car !== null);

    console.log('сформировали - ', winnersWithCars)

    console.log('сформировали...')
    const sortedWinnersWithCars = valid.sort((a, b) => a.time - b.time)

    console.log('обновляем стейт....')
    this.stateManager.setState(prevState => ({
      winners: {
        ...prevState.winners,
        isLoading: false,
        winners: sortedWinnersWithCars,

      }
    }))

    console.log('Обновили стейт, проверяем =>', this.stateManager.getState().winners)
  }

}