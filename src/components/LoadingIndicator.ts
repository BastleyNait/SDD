export class LoadingIndicator {
  constructor(private readonly root: HTMLElement) {
    this.hide();
  }

  show(): void {
    this.root.hidden = false;
    this.root.textContent = 'Cargando…';
  }

  hide(): void {
    this.root.hidden = true;
    this.root.textContent = '';
  }

  get visible(): boolean {
    return !this.root.hidden;
  }
}
