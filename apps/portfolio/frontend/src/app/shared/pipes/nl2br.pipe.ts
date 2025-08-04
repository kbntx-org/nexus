import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'lineBreak'
})
export class LineBreakPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  public transform(value: string): SafeHtml {
    if (!value) {
      return '';
    }
    const html = value.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
