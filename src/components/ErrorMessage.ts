export class ErrorMessage {
  constructor(private readonly root: HTMLElement) {
    this.root.setAttribute('role', 'alert');
  }

  show(message: string): void {
    this.root.textContent = message;
  }

  clear(): void {
    this.root.textContent = '';
  }
}
