import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

import { ServidorProvider } from "./servidor-provider";
import { IIva } from "../interfaces/iva.interface";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

@Injectable({ providedIn: 'root' })
export class IvaProvider extends ComandoProvider {
  private _arquivo: string = 'iva.php';

  constructor(
    private servidor: ServidorProvider,
    sqlite: SQLite) {
    super('iva', new IIva(), sqlite);
  }

  buscar(codigo: number): Observable<IIva> {
    return new Observable(subs =>  {
      if(UtilProvider.objPedido != null && UtilProvider.objPedido.cliente != null) {
        super.select({ codigo: codigo, ufDest: UtilProvider.objPedido.cliente.estado }).subscribe(
          (retorno) => {
            UtilProvider.completarObservable(subs, retorno.rows.item(0));
          }
        );
      }
      else {
        UtilProvider.completarObservable(subs, null);
      }
    });
  }

  excluir(): Observable<boolean> {
    return super.delete({ });
  }

  sincronizar(): Observable<IIva[]> {
    return new Observable<IIva[]>(
      subs => {
        this.servidor.get(this._arquivo).subscribe(
          (data) => {
            this.excluir().subscribe(() => {
              this.importJson(data).subscribe(
                () => {
                },
                err => {
                  alert('Erro na importação dos itens: ' + err)
                },
                () => {
                    UtilProvider.completarObservable(subs, true);
                }
              );
            });
          },
          err => {
            alert('Erro ivas: ' + err);
            UtilProvider.completarObservable(subs, false);
          }
        );
      }
    );
  }
}
