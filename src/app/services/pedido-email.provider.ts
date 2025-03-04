import { Injectable } from '@angular/core';

import { Observable } from "rxjs";
import { UtilProvider } from "./util-provider";
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class PedidoEmailProvider {

  constructor(private storageService: StorageService) {
  }

  salvar(codigo: number, valor: string): Observable<boolean> {
    return new Observable(subs => {
      this.storageService.set('pedido-email' + codigo, valor).then(() => {
        UtilProvider.completarObservable(subs, true);
      }).catch(err => alert(err));
    });
  }

  salvarPlanilha(codigo: number, valor: string): Observable<boolean> {
    return new Observable(subs => {
      this.storageService.set('pedido-planilha' + codigo, valor).then(() => {
        UtilProvider.completarObservable(subs, true);
      }).catch(err => alert(err));
    });
  }

  buscar(codigo: number): Observable<string> {
    return new Observable(subs => {
      this.storageService.get('pedido-email' + codigo).then((retorno) => {
        UtilProvider.completarObservable(subs, retorno);
      });
    });
  }

  buscarPlanilha(codigo: number): Observable<string> {
    return new Observable(subs => {
      this.storageService.get('pedido-planilha' + codigo).then((retorno) => {
        UtilProvider.completarObservable(subs, retorno);
      });
    });
  }
}
