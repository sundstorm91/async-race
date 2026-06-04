import type { InputProps } from '../../types';

export class Input {
  private container: HTMLDivElement;
  private input: HTMLInputElement;
  private label?: HTMLLabelElement;
  private errorElement?: HTMLSpanElement;

  constructor(props: InputProps) {
    this.container = document.createElement('div');
    this.container.className = 'input-container';

    if (props.label) {
      this.label = document.createElement('label');
      this.label.textContent = props.label;
      this.label.className = 'input-label';
      this.container.appendChild(this.label);
    }

    this.input = document.createElement('input');
    this.input.type = props.type || 'text';
    this.input.className = 'input';
    this.input.placeholder = props.placeholder || '';
    this.input.value = props.value;
    this.input.disabled = props.disabled || false;

    this.input.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      props.onChange(value);
    });

    this.container.appendChild(this.input);

    if (props.error) {
      this.showError(props.error);
    }
  }

  private showError(message: string): void {
    if (this.errorElement) {
      this.errorElement.textContent = message;
      return;
    }

    this.errorElement = document.createElement('span');
    this.errorElement.className = 'input-error';
    this.errorElement.textContent = message;
    this.container.appendChild(this.errorElement);
    this.input.classList.add('input--error');
  }

  private clearError(): void {
    if (this.errorElement) {
      this.errorElement.remove();
      this.errorElement = undefined;
    }
    this.input.classList.remove('input--error');
  }

  render(): HTMLElement {
    return this.container;
  }

  update(props: Partial<InputProps>): void {
    if (props.value !== undefined) this.input.value = props.value;
    if (props.disabled !== undefined) this.input.disabled = props.disabled;
    if (props.error !== undefined) {
      props.error ? this.showError(props.error) : this.clearError();
    }
  }

  getValue(): string {
    return this.input.value;
  }
}