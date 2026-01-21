import type { GarageApi, WinnersApi } from "../api"
import type { EventBus } from "../core"
import type { StateManager } from "../core/state-manager"
import type { AppState, Car, RaceWinner } from "../types"

interface IUIService {
  // Навигация
  switchView(view: 'garage' | 'winners'): void

  // Модалки
  showWinnerModal(winner: RaceWinner): void
  hideWinnerModal(): void
  showCreateCarModal(): void
  showUpdateCarModal(car: Car): void
  hideAllModals(): void

  // Уведомления (тосты)
  showNotification(
    message: string,
    type: 'success' | 'error' | 'info',
    duration?: number
  ): string // возвращает id уведомления

  removeNotification(id: string): void
  clearAllNotifications(): void

  // Загрузка
  showGlobalLoading(message?: string): void
  hideGlobalLoading(): void

  // Вспомогательные
  confirmDialog(message: string): Promise<boolean>
}

export class UIService implements IUIService {
    constructor(
        private stateManager: StateManager<AppState>,
        private eventBus: EventBus,
        private garageApi: GarageApi,
        private winnersApi: WinnersApi,
    ) {}

    switchView(view: "garage" | "winners"): void {

        this.stateManager.setState(prevState => ({
            ui: {
                ...prevState.ui,
                activeView: view,
            }
        }))

        this.eventBus.emit('view:changed', view)
    }

    showWinnerModal(winner: RaceWinner): void {

        this.stateManager.setState(prevState => ({
            ui: {
                ...prevState.ui,
                modals: {
                    ...prevState.ui.modals,
                    winner: {
                        data: winner,
                        isOpen: true
                    }
                }
            }
        }))

    }

    hideWinnerModal(): void {
        this.stateManager.setState(prevState => ({
            ui: {
                ...prevState.ui,
                modals: {
                    ...prevState.ui.modals,
                    winner: {
                        ...prevState.ui.modals.winner,
                        isOpen: false
                    }
                }
            }
        }))
    }

    showCreateCarModal(): void {
        this.stateManager.setState(prevState => ({
            ui: {
                ...prevState.ui,
                modals: {
                    ...prevState.ui.modals,
                    createCar: true,
                }
            }
        }))
    }

    showUpdateCarModal(): void {

        this.stateManager.setState(prevState => ({
            ui: {
                ...prevState.ui,
                modals: {
                    ...prevState.ui.modals,
                    updateCar: true,
                }
            },

        }))
    }

    hideAllModals(): void {
        this.stateManager.setState(prevState => ({
            ui: {
                ...prevState.ui,
                modals: {
                    ...prevState.ui.modals,
                    createCar: false,
                    updateCar: false,
                   /*  winner: {
                        ...prevState.ui.modals.winner, <= это все реализовано в hideWinnerModal(Избыточно?)
                        isOpen: false,
                    } */
                }
            }
        }))
    }

    showNotification(
    message: string,
    type: 'success' | 'error' | 'info',
    duration: number = 3000
): string {
    const id = Date.now().toString() + Math.random();

    this.stateManager.setState(prev => ({
        ui: {
            ...prev.ui,
            notifications: [
                ...prev.ui.notifications,
                { id, message, type, timeout: duration }
            ]
        }
    }));

    // Автоудаление
    setTimeout(() => {
        this.removeNotification(id);
    }, duration);

    return id;
}

removeNotification(id: string): void {
    this.stateManager.setState(prev => ({
        ui: {
            ...prev.ui,
            notifications: prev.ui.notifications.filter(n => n.id !== id)
        }
    }));
}

clearAllNotifications(): void {
    this.stateManager.setState(prev => ({
        ui: {
            ...prev.ui,
            notifications: []
        }
    }));
}

showGlobalLoading(message?: string): void {
    this.stateManager.setState(prev => ({
        ui: {
            ...prev.ui,
            isLoading: true,
            loadingMessage: message
        }
    }));
}

hideGlobalLoading(): void {
    this.stateManager.setState(prev => ({
        ui: {
            ...prev.ui,
            isLoading: false,
            loadingMessage: undefined
        }
    }));
}

confirmDialog(message: string): Promise<boolean> {
    return new Promise((resolve) => {
        // Показываем модалку подтверждения
        this.stateManager.setState(prev => ({
            ui: {
                ...prev.ui,
                modals: {
                    ...prev.ui.modals,
                    confirm: {
                        isOpen: true,
                        message,
                        onConfirm: () => resolve(true),
                        onCancel: () => resolve(false)
                    }
                }
            }
        }));
    });
}

}