import { Injectable } from '@angular/core';
import { ServidorProvider } from './servidor-provider';
import { Observable } from 'rxjs';

export interface IStatusPedido {
  Status: string;
  Numero: number;
  Item: { id: number; qtdFat: number }[];
}

@Injectable({ providedIn: 'root' })
export class StatusPedidoProvider {
  //

  constructor(private servidorProvider: ServidorProvider) {}

  getStatus(numero: any): Observable<IStatusPedido> {
    return this.servidorProvider.post('status-pedidos.php', { numero });
  }
}
