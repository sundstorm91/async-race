import type { EngineApi, GarageApi } from "../api";
import type { EventBus } from "../core";
import type { StateManager } from "../core/state-manager";
import { ApiError, type AppState, type RaceParticipant, type RaceStatus, type RaceWinner } from "../types"

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
  updateCarPosition(carId: number, progress: number): void
  stopAllAnimations(): void

  // Утилиты
  calculateRaceTime(velocity: number, distance: number): number
}

export class RaceService implements IRaceService {
    constructor(
        private stateManager: StateManager<AppState>,
        private eventBus: EventBus,
        private engineApi: EngineApi,
    ) {}

    private stopAnimationForCar(carId: number):void {
        const participant = this.stateManager.getState().race.participants.find(p => p.carId === carId);

        if (participant?.animationId) {
            cancelAnimationFrame(participant.animationId)
        }
    }


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


    async stopSingleCar(carId: number): Promise<void> {

        await this.engineApi.stopEngine(carId)
        this.stopAnimationForCar(carId)

        this.stateManager.setState(prevState => ({
            race: {
                ...prevState.race,
                participants: prevState.race.participants.map(p => p.carId === carId ? { ...p, status: 'stopped', animationId: undefined} : p)
            }
        }))
    }
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







    async startRace(): Promise<void> {
        this.resetRace();
        const cars = this.stateManager.getState().garage.cars;

        // Запускаем все машины ОДНОВРЕМЕННО
        const promises = cars.map(car =>
            this.startSingleCar(car.id)
        );

        await Promise.all(promises);
        console.log('🎉 All cars finished!');
    }



    async startSingleCar(carId: number):Promise<void> {
        const car = this.stateManager.getState().garage.cars.find(car => car.id === carId);

        if (!car) return;

            this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                participants: [
                    ...prev.race.participants.filter(p => p.carId !== carId),
                    { carId, car, status: 'racing', position: 0 }
                ]
            }
        }));

        this.simpleCarAnimation(carId);
        return Promise.resolve();

    }


        private simpleCarAnimation(carId: number): void {
            console.log('🎬 simpleCarAnimation STARTED for car', carId);

        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            console.log('🔄 Animation loop:', carId, 'progress:', progress, '%');

            this.updateCarPositionDirectly(carId, progress); // ← ВЫЗЫВАЕТСЯ?

            if (progress >= 100) {
                clearInterval(interval);
                console.log('🏁 Animation finished');
            }
        }, 100);
    }

        private updateCarPositionDirectly(carId: number, progress: number): void {
        console.log('📍 updateCarPosition CALLED:', carId, progress, '%');

        const prevState = this.stateManager.getState();
        console.log('Prev participants:', prevState.race.participants);

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

        // Вариант B: Прямо в DOM (если не работает через стейт)
        /* const carElement = document.querySelector(`[data-car-id="${carId}"]`);
        if (carElement) {
            const carImage = carElement.querySelector('.car-image');
            if (carImage) {
                (carImage as HTMLElement).style.transform = `translateX(${progress}%)`;
            }
        } */

        const newState = this.stateManager.getState();
        console.log('New participants:', newState.race.participants);
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

    updateCarPosition(carId: number, progress: number): void {
        this.stateManager.setState(prevState => ({
        race: {
                ...prevState.race,
                participants: prevState.race.participants.map(p => p.carId === carId ? {...p, position: progress} : p)
            }
        }))
    }

}