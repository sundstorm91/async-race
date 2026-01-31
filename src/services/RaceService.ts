import type { EngineApi } from "../api";
import type { EventBus } from "../core";
import type { StateManager } from "../core/state-manager";
import { ApiError, type AppState, type EngineStatus, type RaceParticipant, type RaceStatus, type RaceWinner } from "../types"

interface RaceResult {
  carId: number;
  success: boolean;     // доехала или сломалась
  time?: number;        // время в секундах (если success)
  brokenAt?: number;    // прогресс 0-100% где сломалась (если !success)
}

interface IRaceService {
  // Управление гонкой
  /* startRace(): Promise<RaceWinner | null> */
  startRace():Promise<void>
  resetRace(): void
  /* startSingleCar(carId: number): Promise<RaceResult> */

  startSingleCar(carId: number): Promise<void>;

  stopSingleCar(carId: number): Promise<void>

  // Состояние гонки
  getRaceStatus(): RaceStatus
  getParticipants(): RaceParticipant[]
  getWinner(): RaceWinner | null

  // Анимация
  /* updateCarPosition(carId: number, progress: number): void */
  stopAllAnimations(): void

  // Утилиты
  calculateRaceTime(velocity: number, distance: number): number
}

export class RaceService {

    private engineDataMap: Map<number, EngineStatus> = new Map();

    constructor(
        private stateManager: StateManager<AppState>,
        private eventBus: EventBus,
        private engineApi: EngineApi,
    ) {}






    async startRace(): Promise<void> {
        console.log('🏁 START RACE (Этап 1)');

        // ПРОСТОЙ сброс
        this.stateManager.setState(prev => ({
            race: {
                status: 'racing',
                participants: [],
                winner: null,
                results: []
            }
        }));

        const cars = this.stateManager.getState().garage.cars;

        // Запускаем всех
        cars.forEach(car => {
            this.startSingleCar(car.id);
        });

        console.log('🎉 Все машины запущены');
    }

    async startSingleCar(carId: number): Promise<void> {
        console.log('🚗 startSingleCar для машины', carId);

        // 1. Находим машину
        const car = this.stateManager.getState().garage.cars.find(c => c.id === carId);
        if (!car) {
            console.error('Машина не найдена:', carId);
            return;
        }

        // 2. ПРОСТО добавляем в участники
        this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                participants: [
                    ...prev.race.participants,
                    {
                        carId,
                        car,
                        status: 'racing',
                        position: 0  // ← на старте 0%
                    }
                ]
            }
        }));

        try {
            // 3. Запускаем двигатель через API (мок)
            console.log('🔧 Запрашиваем данные двигателя...');
            const engineData = await this.engineApi.startEngine(carId);
            console.log('📊 Данные двигателя:', engineData);

                this.engineDataMap.set(carId, engineData);

            // 4. Обновляем статус на "racing"
            this.stateManager.setState(prev => ({
                race: {
                    ...prev.race,
                    participants: prev.race.participants.map(p =>
                        p.carId === carId
                            ? { ...p, status: 'racing' }
                            : p
                    )
                }
            }));

            // 5. Рассчитываем и запускаем анимацию
            const duration = this.calculateAnimationDuration(
                engineData.distance,
                engineData.velocity
            );

            this.startCarAnimation(carId, duration, engineData);

        } catch (error) {
            console.error('Ошибка запуска двигателя:', error);
            this.stateManager.setState(prev => ({
                race: {
                    ...prev.race,
                    participants: prev.race.participants.map(p =>
                        p.carId === carId
                            ? { ...p, status: 'broken' }
                            : p
                    )
                }
            }));
        }
    }



     private calculateAnimationDuration(distance: number, velocity: number): number {
        console.log(`📊 Real API data - distance: ${distance}, velocity: ${velocity}`);

        const SCALE_FACTOR = 1000;
        const scaledDistance = distance / SCALE_FACTOR;
        const realTimeInSeconds = scaledDistance / velocity;

        console.log(`📏 Scaled distance: ${scaledDistance}`);
        console.log(`⏱️ Real time: ${realTimeInSeconds.toFixed(2)}s`);

        // Ограничиваем для UI
        const uiTimeInSeconds = Math.max(2, Math.min(realTimeInSeconds, 10));
        const duration = uiTimeInSeconds * 1000;

        console.log(`🎬 UI animation duration: ${duration}ms (${uiTimeInSeconds.toFixed(2)}s)`);

        return duration;
    }

    private startCarAnimation(
        carId: number,
        duration: number,
        engineData: EngineStatus
    ): Promise<boolean> {
        return new Promise((resolve) => {
            console.log(`🎬 Анимация для ${carId}, длительность: ${duration}мс`);

            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min((elapsed / duration) * 100, 100);

                // Обновляем позицию
                this.updateCarPosition(carId, progress);

                if (progress < 100) {
                    requestAnimationFrame(animate);
                } else {
                    // Анимация завершена, проверяем drive
                    this.checkDrive(carId, engineData).then(success => {
                        resolve(success);
                    });
                }
            };

            requestAnimationFrame(animate);
        });
    }

    private async checkDrive(
        carId: number,
        engineData: EngineStatus
    ): Promise<boolean> {
        try {
            const result = await this.engineApi.drive(carId);

            this.stateManager.setState(prev => ({
                race: {
                    ...prev.race,
                    participants: prev.race.participants.map(p =>
                        p.carId === carId
                            ? {
                                ...p,
                                status: result.success ? 'finished' : 'broken',
                                position: result.success ? 100 : 50 // Сломался на полпути
                            }
                            : p
                    )
                }
            }));

            // Если успешно доехала - возвращаем время
            if (result.success) {
                const time = engineData.distance / engineData.velocity;
                this.handleCarFinished(carId, time);
            }

            return result.success;
        } catch (error) {
            console.error('Ошибка drive:', error);
            this.stateManager.setState(prev => ({
                race: {
                    ...prev.race,
                    participants: prev.race.participants.map(p =>
                        p.carId === carId
                            ? { ...p, status: 'broken', position: 50 }
                            : p
                    )
                }
            }));
            return false;
        }
    }

    private handleCarFinished(carId: number): void {
        const engineDataMap = this.engineDataMap.get(carId);
        if (!engineDataMap) return;

        const scaledTime = this.calculateAnimationDuration(engineDataMap.distance, engineDataMap.velocity) / 1000;
        console.log(`🏁 Машина ${carId} финишировала за ${scaledTime.toFixed(2)}с`);
        this.eventBus.emit('car:finished', { carId, time: scaledTime});
    }

    private updateCarPosition(carId: number, progress: number): void {
        this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                participants: prev.race.participants.map(p =>
                    p.carId === carId
                        ? { ...p, position: progress }
                        : p
                )
            }
        }));
    }




    getParticipants(): RaceParticipant[] {
        return this.stateManager.getState().race.participants;
    }

    getRaceStatus(): RaceStatus {
        return this.stateManager.getState().race.status;
    }

    getWinner(): RaceWinner | null {
        return this.stateManager.getState().race.winner;
    }

    stopAllAnimations():void {
        this.stateManager.getState().race.participants.forEach(item => {

            if (item.animationId) {
                cancelAnimationFrame(item.animationId) /* requestAnimationFrame */
            }

        })

        this.stateManager.setState(prevState => ({
            race: {
                ...prevState.race,
                participants: prevState.race.participants.map(p => ({
                    ...p,
                    animationId: undefined,
                }))
            }
        }))
    }

    resetRace(): void {

        this.stopAllAnimations();

        const promises = this.stateManager.getState().race.participants.map(participant => this.engineApi.stopEngine(participant.carId).catch(()=>{}));

        Promise.all(promises).catch(()=>{})

        this.stateManager.setState(prevState => ({
            race: {
                results: [],
                winner: null,
                participants: [],
                status: 'idle'
            }
        }))
        this.engineDataMap.clear();

        this.eventBus.emit('race:reset')
    }

    calculateRaceTime(velocity: number, distance: number): number {
        return Math.round(distance / velocity)
    }

    private stopAnimationForCar(carId: number):void {
        const participant = this.stateManager.getState().race.participants.find(p => p.carId === carId);

        if (participant?.animationId) {
            cancelAnimationFrame(participant.animationId)
        }
    }

}

