import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'reais'
})
export class ReaisPipe implements PipeTransform {
  transform(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
