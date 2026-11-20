import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: 'input[appTextOnly], textarea[appTextOnly]',
  standalone: true,
})
export class TextOnlyDirective {
  private readonly textPattern = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/;

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(event: InputEvent): void {
    if (event.data && this.textPattern.test(event.data)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';
    if (this.textPattern.test(pastedText)) {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    const cleaned = input.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
    if (cleaned !== input.value) {
      input.value = cleaned;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}