import { carSVG } from '../../../assets/svg/CarSVG';
import type { EventBus } from '../../../core';
import type { CarProps } from '../../../types';
import { Button } from '../../Button/Button';

export class CarComponent {
  private element: HTMLDivElement;
  private carImage: HTMLDivElement;
  private carTrack: HTMLDivElement;
  private finishFlag: HTMLDivElement;
  private nameElement: HTMLSpanElement;
  private selectButton: Button;
  private removeButton: Button;
  private startButton: Button;
  private stopButton: Button;


  constructor(props: CarProps) {
    this.element = document.createElement('div');
    this.element.className = `car ${props.isSelected ? 'car--selected' : ''} ${props.isRacing ? 'car--racing' : ''}`;

    // Информация о машине
    const info = document.createElement('div');
    info.className = 'car-info';

    this.nameElement = document.createElement('span');
    this.nameElement.textContent = props.car.name;
    this.nameElement.className = 'car-name';
    info.appendChild(this.nameElement);

    const colorIndicator = document.createElement('div');
    colorIndicator.className = 'car-color';
    colorIndicator.style.backgroundColor = props.car.color;
    info.appendChild(colorIndicator);

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

    // Изображение машины

    this.carTrack = document.createElement('div');
    this.carTrack.className = 'car-track';

    this.carImage = document.createElement('div');
    this.carImage.className = 'car-image';
    this.carImage.innerHTML = carSVG({color: props.car.color});
    this.carImage.style.transform = `translateX(${props.position || 0}%)`;

    this.finishFlag = document.createElement('div');
    this.finishFlag.className = 'finish-flag';
    this.finishFlag.textContent = '🏁';

    this.carTrack.appendChild(this.carImage);
    this.carTrack.appendChild(this.finishFlag);

    this.element.appendChild(this.carTrack);
  }

  update(props: Partial<CarProps>): void {
    if (props.car?.name !== undefined) {
      this.nameElement.textContent = props.car.name;
    }

    if (props.car?.color !== undefined) {
      this.carImage.style.backgroundColor = props.car.color;
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
      this.carImage.style.transform = `translateX(${props.position}%)`;
    }
  }

  render(): HTMLElement {
    return this.element;
  }
}