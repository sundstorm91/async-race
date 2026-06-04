interface CarAnimationData {
  stop: () => void;
  isBroken: boolean;
  startTime: number;
}

const carAnimations = new WeakMap<HTMLElement, {
  stop: () => void;
  isBroken: boolean;
}>();


/**
 * Запускает анимацию движения машинки от старта до финиша
 * @param carElement - DOM-элемент машинки
 * @param durationMs - Время прохождения трека в миллисекундах
 * @param onProgress - Колбек, вызываемый на каждом кадре анимации (прогресс 0..1)
 * @param onFinish - Колбек, вызываемый при успешном завершении анимации
 * @returns Функция stop(), которую можно вызвать для остановки анимации
 */
export function startCarAnimation(
  carElement: HTMLElement,
  durationMs: number,
  onProgress?: (progress: number) => void,
  onFinish?: () => void
): () => void {

  const existingCar = carAnimations.get(carElement);

  if (existingCar) {
    existingCar.stop()
  }

  // 1. Сохраняем начальное время
  const startTime = performance.now();
  let animationFrameId: number;
  let isStopped = false;

  // 2. Функция анимации (вызывается каждый кадр)
  function animate(currentTime: number) {
    if (isStopped) return;

    // Сколько времени прошло с начала
    const elapsed = currentTime - startTime;

    // Прогресс от 0 до 1
    const progress = Math.min(elapsed / durationMs, 1);

    // 3. Двигаем машинку
    // От 0% до 100% по горизонтали
    carElement.style.transform = `translateX(${progress * 100}%)`;

    // 4. Вызываем колбек прогресса (если есть)
    if (onProgress) {
      onProgress(progress);
    }

    // 5. Проверяем, доехали ли
    if (progress < 1) {
      // Продолжаем анимацию
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // Анимация завершена
      if (onFinish) onFinish();
    }
  }

  // 6. Запускаем первый кадр
  animationFrameId = requestAnimationFrame(animate);

  // 7. Возвращаем функцию для остановки
  return function stop() {
    isStopped = true;
    cancelAnimationFrame(animationFrameId);
  };
}