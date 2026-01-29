import type { EngineApi, GarageApi } from "../api";
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

    private handleCarFinished(carId: number, time: number): void {
        console.log(`🏁 Машина ${carId} финишировала за ${time.toFixed(2)}с`);

        // Здесь будет логика определения победителя
        // Пока просто логируем
        this.eventBus.emit('car:finished', { carId, time });
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

/* private simpleCarAnimation(carId: number): void {
        console.log('🎬 Анимация запущена для машины', carId);

        let progress = 0;
        const interval = setInterval(() => {
            progress += 5; // 5% за шаг

            console.log(`📈 Машина ${carId}: ${progress}%`);

            // ОБНОВЛЯЕМ ПОЗИЦИЮ
            this.updateCarPosition(carId, progress);

            if (progress >= 100) {
                clearInterval(interval);
                console.log(`🏁 Машина ${carId} финишировала!`);

                // Обновляем статус
                this.stateManager.setState(prev => ({
                    race: {
                        ...prev.race,
                        participants: prev.race.participants.map(p =>
                            p.carId === carId
                                ? { ...p, status: 'finished', position: 100 }
                                : p
                        )
                    }
                }));
            }
        }, 100); // Каждые 100мс
    } */

/* updateCarPosition(carId: number, progress: number): void {
        this.stateManager.setState(prevState => ({
        race: {
                ...prevState.race,
                participants: prevState.race.participants.map(p => p.carId === carId ? {...p, position: progress} : p)
            }
        }))
    } */


 /* private startCarAnimation(carId: number, duration: number): Promise<void> {
        return new Promise((resolve) => {
            console.log('🎬 ANIMATION START for car', carId, 'duration:', duration, 'ms');

            const startTime = Date.now();
            let animationId: number;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min((elapsed / duration) * 100, 100);

                // Обновляем позицию
                this.updateCarPosition(carId, progress);
                console.log('📈 Car', carId, 'position:', progress.toFixed(1) + '%');

                if (progress < 100) {
                    animationId = requestAnimationFrame(animate);

                    // Сохраняем animationId
                    this.stateManager.setState(prev => ({
                        race: {
                            ...prev.race,
                            participants: prev.race.participants.map(p =>
                                p.carId === carId
                                    ? { ...p, animationId }
                                    : p
                            )
                        }
                    }));
                } else {
                    console.log('🏁 Car', carId, 'animation finished');
                    resolve(); // Анимация завершена!
                }
            };

            animationId = requestAnimationFrame(animate);
        });
    } */


 /* async startRace(): Promise<RaceWinner | null> {
        // 1. Сброс
        this.resetRace();

        // 2. Создаём участников из текущих машин
        const cars = this.stateManager.getState().garage.cars;
        const participants: RaceParticipant[] = cars.map(car => ({
            carId: car.id,
            car,
            status: 'starting' as const,
            startTime: Date.now()
        }));

        // 3. Начинаем гонку
        this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                status: 'racing',
                participants
            }
        }));

        this.eventBus.emit('race:started', { participants });

        // 4. Запускаем всех
        const promises = participants.map(p => this.startSingleCar(p.carId));
        const results = await Promise.all(promises);

        // 5. Обновляем статусы участников по результатам
        this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                participants: prev.race.participants.map(p => {
                    const result = results.find(r => r.carId === p.carId);
                    return {
                        ...p,
                        status: result?.success ? 'finished' : 'broken',
                        finishTime: result?.success ? Date.now() : undefined
                    };
                })
            }
        }));

        // 6. Находим победителя
        const winnerResult = results.find(r => r.success);
        if (!winnerResult) {
            this.stateManager.setState(prev => ({
                race: { ...prev.race, status: 'finished' }
            }));
            return null;
        }

        const winnerCar = cars.find(c => c.id === winnerResult.carId)!;
        const winner: RaceWinner = { car: winnerCar, time: winnerResult.time! };

        this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                status: 'finished',
                winner
            }
        }));

        this.eventBus.emit('race:finished', { winner });
        return winner;
    } */


         /*     async startSingleCar(carId: number): Promise<RaceResult> {
        console.log('🏁 START_SINGLE_CAR called for:', carId);

        try {
            // ПРОВЕРЯЕМ: есть ли уже участник?
            let participant = this.stateManager.getState().race.participants
                .find(p => p.carId === carId);

            // Если нет (одиночный старт) - создаём
            if (!participant) {
                const car = this.stateManager.getState().garage.cars.find(c => c.id === carId);
                if (!car) throw new Error(`Car ${carId} not found`);

                this.stateManager.setState(prev => ({
                    race: {
                        ...prev.race,
                        participants: [
                            ...prev.race.participants,
                            {
                                carId,
                                car,
                                status: 'starting' as const,
                                startTime: Date.now(),
                                animationId: undefined,
                                position: 0
                            }
                        ]
                    }
                }));
            } else {
                // Если уже есть - обновляем статус
                this.stateManager.setState(prev => ({
                    race: {
                        ...prev.race,
                        participants: prev.race.participants.map(p =>
                            p.carId === carId
                                ? { ...p, status: 'starting' as const }
                                : p
                        )
                    }
                }));
            }

            console.log('1. Starting engine...');
            const { distance, velocity } = await this.engineApi.startEngine(carId);
            console.log('2. Engine started:', { distance, velocity });

            // Обновляем статус на racing
            this.stateManager.setState(prev => ({
                race: {
                    ...prev.race,
                    participants: prev.race.participants.map(p =>
                        p.carId === carId
                            ? { ...p, status: 'racing' as const }
                            : p
                    )
                }
            }));

            // Рассчитываем время анимации
            const duration = (distance / velocity) * 1000; // мс
            console.log('⏱️ Animation duration:', duration, 'ms');

            // ЗАПУСКАЕМ АНИМАЦИЮ
            this.startCarAnimation(carId, duration);

            // ЖДЁМ окончания анимации перед drive
            // Drive должен совпадать с окончанием анимации
            const driveResult = await new Promise<{success: boolean}>((resolve) => {
                setTimeout(async () => {
                    try {
                        console.log('3. Starting drive...');
                        const result = await this.engineApi.drive(carId);
                        console.log('4. Drive result:', result);
                        resolve(result);
                    } catch (error) {
                        console.error('Drive error:', error);
                        resolve({ success: false });
                    }
                }, duration); // Ждём duration мс
            });

            // Обновляем статус по результату
            this.stateManager.setState(prev => ({
                race: {
                    ...prev.race,
                    participants: prev.race.participants.map(p =>
                        p.carId === carId
                            ? {
                                ...p,
                                status: driveResult.success ? 'finished' as const : 'broken' as const,
                                finishTime: Date.now(),
                                position: driveResult.success ? 100 : 50 // если сломалась - останавливаем на 50%
                            }
                            : p
                    )
                }
            }));

            return {
                carId,
                success: driveResult.success,
                time: driveResult.success ? distance / velocity : undefined
            };

        } catch (err) {
            console.error('💥 Error in startSingleCar:', err);
        // Если ошибка — помечаем как broken
        this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                participants: prev.race.participants.map(p =>
                    p.carId === carId
                        ? { ...p, status: 'broken' as const }
                        : p
                )
            }
        }));

        if (err instanceof ApiError && err.status === 500) {
            return { carId, success: false };
        }
        throw err;
        }
    } */