import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

import { ServidorProvider } from "./servidor-provider";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { IFotos } from '../interfaces/fotos.interface';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

@Injectable({ providedIn: 'root' })
export class FotosProvider extends ComandoProvider {
  private _arquivo: string = 'fotos2.php';

  constructor(
    private servidor: ServidorProvider,
    sqlite: SQLite) {
    super('fotos', new IFotos(), sqlite);
  }

  buscar(proCodigo: number): Observable<IFotos> {
    return new Observable(subs => {
      super.select({ proCodigo: proCodigo }).subscribe(
        (retorno) => {
          //console.log(proCodigo, retorno.rows.length);
          if (retorno.rows.length > 0) {
            UtilProvider.completarObservable(subs, retorno.rows.item(0));
          }
          else {
            UtilProvider.completarObservable(subs, null);
          }
        }
      );
    });
  }

  excluir(proCodigo: number): Observable<boolean> {
    return super.delete({ proCodigo: proCodigo });
  }

  sincronizar(proCodigo: number): Observable<IFotos> {
    return new Observable<IFotos>(
      subs => {
        this.servidor.get(this._arquivo + '?proCodigo=' + proCodigo).subscribe(
          (data: any) => {
            //console.log('data', (data.data.inserts.fotos.proCodigo));
            this.excluir(proCodigo).subscribe(() => {
              this.insert(data.data.inserts.fotos).subscribe(
                () => {
                  UtilProvider.completarObservable(subs, data.data.inserts.fotos);
                }
              );
            });
          }
        );
      }
    );
  }
}
