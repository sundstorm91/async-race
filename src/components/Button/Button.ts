import type { ButtonProps } from '../../types';

export class Button {
  private element: HTMLButtonElement;

  constructor(props: ButtonProps) {
    this.element = document.createElement('button');
    this.element.className = this.getClassNames(props);
    this.element.textContent = props.text;
    this.element.disabled = props.disabled || false;

    if (props.icon) {
      const icon = document.createElement('span');
      icon.className = 'btn-icon';
      icon.textContent = props.icon;
      this.element.prepend(icon);
    }

    this.element.addEventListener('click', (e) => {
      e.preventDefault();
      props.onClick();
    });
  }

  private getClassNames(props: ButtonProps): string {
    const classes = ['button'];
    if (props.type) classes.push(`button--${props.type}`);
    if (props.size) classes.push(`button--${props.size}`);
    if (props.disabled) classes.push('button--disabled');
    return classes.join(' ');
  }

  render(): HTMLElement {
    return this.element;
  }

  update(props: Partial<ButtonProps>): void {
    if (props.text !== undefined) this.element.textContent = props.text;
    if (props.disabled !== undefined) this.element.disabled = props.disabled;
    if (props.type !== undefined) {
      this.element.className = this.getClassNames({
        ...this.getCurrentProps(),
        ...props
      });
    }
  }

  private getCurrentProps(): ButtonProps {
    const typeMatch = this.element.className.match(/button--(primary|secondary|danger|success)/);
    const sizeMatch = this.element.className.match(/button--(small|medium|large)/);

    return {
      text: this.element.textContent || '',
      type: (typeMatch?.[1] as ButtonProps['type']) || 'primary',
      size: (sizeMatch?.[1] as ButtonProps['size']) || 'medium',
      disabled: this.element.disabled,
      onClick: () => {}
    };
  }
}