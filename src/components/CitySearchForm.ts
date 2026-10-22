export const MSG_REQUIRED = 'El nombre de la ciudad es obligatorio.';

export class CitySearchForm {
  readonly form: HTMLFormElement;
  readonly input: HTMLInputElement;
  readonly button: HTMLButtonElement;
  private readonly validation: HTMLParagraphElement;

  constructor(
    root: HTMLElement,
    private readonly onSearch: (cityName: string) => void,
    private readonly onInvalid: () => void = () => {}, // v1.2 — Req 1.7
  ) {
    this.form = document.createElement('form');
    this.form.noValidate = true;
    this.form.setAttribute('aria-label', 'Buscar clima');

    const label = document.createElement('label');
    label.htmlFor = 'city-input';
    label.textContent = 'Ciudad';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.id = 'city-input';
    this.input.name = 'city';
    this.input.maxLength = 100;
    this.input.placeholder = 'Ej. Arequipa';
    this.input.autocomplete = 'off';

    this.button = document.createElement('button');
    this.button.type = 'submit';
    this.button.textContent = 'Buscar';

    this.validation = document.createElement('p');
    this.validation.className = 'validation-message';
    this.validation.setAttribute('role', 'alert');

    this.form.append(label, this.input, this.button, this.validation);
    root.appendChild(this.form);

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // evita doble envío por el submit implícito
        this.submit();
      }
    });
  }

  submit(): void {
    const value = this.input.value.trim();
    if (value === '') {
      this.validation.textContent = MSG_REQUIRED;
      this.onInvalid();
      return;
    }
    this.validation.textContent = '';
    this.onSearch(value);
  }

  clearValidation(): void {
    this.validation.textContent = '';
  }

  focus(): void {
    this.input.focus();
  }
}
