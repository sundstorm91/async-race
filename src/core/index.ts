import { EventBus } from "./event-bus";

// Создаем глобальный экземпляр EventBus
// Это как "единая рация" для всего приложения
export const eventBus = new EventBus();

// Экспортируем класс для тестирования
export { EventBus };