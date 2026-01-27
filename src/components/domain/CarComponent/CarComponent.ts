import type { CarProps } from '../../../types';
import { Button } from '../../Button/Button';

export class CarComponent {
  private element: HTMLDivElement;
  private carSvg: SVGSVGElement;
  /* private carImage: HTMLDivElement; */
  private nameElement: HTMLSpanElement;
  private selectButton: Button;
  private removeButton: Button;
  private startButton: Button;
  private stopButton: Button;

  constructor(props: CarProps) {
    this.element = document.createElement('div');
    this.element.className = `car ${props.isSelected ? 'car--selected' : ''} ${props.isRacing ? 'car--racing' : ''}`; /* ! */

    // Информация о машине
    const info = document.createElement('div');
    info.className = 'car-info';

    this.nameElement = document.createElement('span');
    this.nameElement.textContent = props.car.name;
    this.nameElement.className = 'car-name';
    info.appendChild(this.nameElement);

    this.element.appendChild(info);

    // Кнопки управления
    const controls = document.createElement('div');
    controls.className = 'car-controls';

    this.selectButton = new Button({
      text: 'Select',
      type: 'secondary',
      size: 'small',
      onClick: props.onSelect
    });

    this.removeButton = new Button({
      text: 'Remove',
      type: 'danger',
      size: 'small',
      onClick: props.onRemove
    });

    this.startButton = new Button({
      text: 'Start',
      type: 'success',
      size: 'small',
      onClick: props.onStart,
      disabled: props.isRacing
    });

    this.stopButton = new Button({
      text: 'Stop',
      type: 'danger',
      size: 'small',
      onClick: props.onStop,
      disabled: !props.isRacing
    });

    controls.appendChild(this.selectButton.render());
    controls.appendChild(this.removeButton.render());
    controls.appendChild(this.startButton.render());
    controls.appendChild(this.stopButton.render());

    this.element.appendChild(controls);

    const carImageContainer = document.createElement('div');
    carImageContainer.className = 'car-image-container';
    carImageContainer.style.transform = `translateX(${props.position || 0}%)`
    // Создаем SVG элемент
    this.carSvg = this.createCarSvg(props.car.color);
    carImageContainer.appendChild(this.carSvg);

    this.element.appendChild(carImageContainer);

  }

  private createCarSvg(color: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 50');
  svg.setAttribute('class', 'car-svg');

  // Основной кузов
  const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  body.setAttribute('d', 'M10 35 Q15 20 25 20 L75 20 Q85 20 90 35 Q85 45 75 45 L25 45 Q15 45 10 35');
  body.setAttribute('fill', color);
  body.setAttribute('stroke', '#000');
  body.setAttribute('stroke-width', '1');

  // Верхняя часть
  const top = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  top.setAttribute('d', 'M30 20 L70 20 Q75 22 78 25 L22 25 Q25 22 30 20');
  top.setAttribute('fill', color);
  top.setAttribute('opacity', '0.8');

  // Окна
  const window1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  window1.setAttribute('x', '32');
  window1.setAttribute('y', '22');
  window1.setAttribute('width', '15');
  window1.setAttribute('height', '8');
  window1.setAttribute('rx', '2');
  window1.setAttribute('fill', '#87CEEB');
  window1.setAttribute('opacity', '0.7');

  const window2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  window2.setAttribute('x', '53');
  window2.setAttribute('y', '22');
  window2.setAttribute('width', '15');
  window2.setAttribute('height', '8');
  window2.setAttribute('rx', '2');
  window2.setAttribute('fill', '#87CEEB');
  window2.setAttribute('opacity', '0.7');

  // Колеса с дисками
  const wheel1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  wheel1.setAttribute('cx', '25');
  wheel1.setAttribute('cy', '40');
  wheel1.setAttribute('r', '7');
  wheel1.setAttribute('fill', '#333');

  const wheel2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  wheel2.setAttribute('cx', '75');
  wheel2.setAttribute('cy', '40');
  wheel2.setAttribute('r', '7');
  wheel2.setAttribute('fill', '#333');

  // Спицы колес
  const spokes1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  spokes1.setAttribute('cx', '25');
  spokes1.setAttribute('cy', '40');
  spokes1.setAttribute('r', '4');
  spokes1.setAttribute('fill', 'none');
  spokes1.setAttribute('stroke', '#AAA');
  spokes1.setAttribute('stroke-width', '1.5');
  spokes1.setAttribute('stroke-dasharray', '2, 4');

  const spokes2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  spokes2.setAttribute('cx', '75');
  spokes2.setAttribute('cy', '40');
  spokes2.setAttribute('r', '4');
  spokes2.setAttribute('fill', 'none');
  spokes2.setAttribute('stroke', '#AAA');
  spokes2.setAttribute('stroke-width', '1.5');
  spokes2.setAttribute('stroke-dasharray', '2, 4');

  // Фара
  const headlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  headlight.setAttribute('cx', '92');
  headlight.setAttribute('cy', '32');
  headlight.setAttribute('r', '3');
  headlight.setAttribute('fill', '#FFD700');
  headlight.setAttribute('filter', 'url(#glow)');

  // Добавляем градиент для блеска
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'carGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');

  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', color);

  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', this.darkenColor(color, 20));

  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);

  // Применяем градиент к кузову
  body.setAttribute('fill', 'url(#carGradient)');

  svg.appendChild(defs);
  svg.appendChild(body);
  svg.appendChild(top);
  svg.appendChild(window1);
  svg.appendChild(window2);
  svg.appendChild(wheel1);
  svg.appendChild(wheel2);
  svg.appendChild(spokes1);
  svg.appendChild(spokes2);
  svg.appendChild(headlight);

  return svg;
}

// Вспомогательный метод для затемнения цвета
private darkenColor(color: string, percent: number): string {
  // Простая реализация затемнения hex цвета
  // В реальном проекте лучше использовать библиотеку
  return color; // Заглушка
}



  update(props: Partial<CarProps>): void {
    if (props.car?.name !== undefined) {
      this.nameElement.textContent = props.car.name;
    }

    if (props.car?.color !== undefined) {
      this.carSvg.style.backgroundColor = props.car.color;
    }

    if (props.isSelected !== undefined) {
      this.element.classList.toggle('car--selected', props.isSelected);
    }

    if (props.isRacing !== undefined) {
      this.element.classList.toggle('car--racing', props.isRacing);
      this.startButton.update({ disabled: props.isRacing });
      this.stopButton.update({ disabled: !props.isRacing });
    }

    if (props.position !== undefined) {
      this.carSvg.style.transform = `translateX(${props.position}%)`;
    }
  }

  render(): HTMLElement {
    return this.element;
  }
}