import { getByLabelText, getByRole } from '@testing-library/dom';
import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CitySearchForm, MSG_REQUIRED } from './CitySearchForm';

let root: HTMLElement;
beforeEach(() => { document.body.innerHTML = '<div id="r"></div>'; root = document.getElementById('r')!; });

describe('CitySearchForm', () => {
  // Feature: weather-forecast-app, Propiedad 1: rechazo de whitespace
  it('P1: entradas solo-whitespace no invocan onSearch y muestran validación', () => {
    fc.assert(fc.property(fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')), (ws) => {
      root.replaceChildren();
      const onSearch = vi.fn();
      const onInvalid = vi.fn();
      const f = new CitySearchForm(root, onSearch, onInvalid);
      f.input.value = ws.replace(/[\n\r]/g, ' '); // un <input> no admite saltos de línea
      f.button.click();
      expect(onSearch).not.toHaveBeenCalled();
      expect(onInvalid).toHaveBeenCalledTimes(1); // v1.2 — Req 1.7
      expect(root.querySelector('.validation-message')!.textContent).toBe(MSG_REQUIRED);
    }));
  });

  // Feature: weather-forecast-app, Propiedad 2: trim antes de enviar
  it('P2: onSearch recibe el valor recortado', () => {
    const core = fc.string({ minLength: 1 }).filter((s) => s.trim() === s && s !== '' && !/[\n\r]/.test(s));
    fc.assert(fc.property(fc.stringOf(fc.constantFrom(' ', '\t')), core, fc.stringOf(fc.constantFrom(' ', '\t')), (a, c, b) => {
      root.replaceChildren();
      const onSearch = vi.fn();
      const onInvalid = vi.fn();
      const f = new CitySearchForm(root, onSearch, onInvalid);
      f.input.value = `${a}${c}${b}`;
      f.button.click();
      expect(onSearch).toHaveBeenCalledWith(f.input.value.trim());
      expect(onInvalid).not.toHaveBeenCalled();
    }));
  });

  it('renderiza City_Input con maxlength=100 (consultado como lo haría un usuario: por su etiqueta)', () => {
    new CitySearchForm(root, vi.fn());
    const input = getByLabelText(root, 'Ciudad') as HTMLInputElement;
    expect(input.getAttribute('maxlength')).toBe('100');
    expect(getByRole(root, 'button', { name: 'Buscar' })).toBeTruthy();
  });
  it('envía con clic en el botón', () => {
    const onSearch = vi.fn();
    new CitySearchForm(root, onSearch);
    (getByLabelText(root, 'Ciudad') as HTMLInputElement).value = ' Lima ';
    getByRole(root, 'button', { name: 'Buscar' }).click();
    expect(onSearch).toHaveBeenCalledWith('Lima');
  });
  it('envía con Enter mientras City_Input está enfocado (una sola vez)', () => {
    const onSearch = vi.fn();
    const f = new CitySearchForm(root, onSearch);
    f.input.value = 'Cusco';
    f.input.focus();
    f.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('Cusco');
  });
  it('City_Input permanece habilitado tras una validación fallida', () => {
    const f = new CitySearchForm(root, vi.fn());
    f.button.click();
    expect(f.input.disabled).toBe(false);
  });
});
