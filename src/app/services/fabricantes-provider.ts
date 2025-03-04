import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

import { ServidorProvider } from "./servidor-provider";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { IFabricantes } from '../interfaces/fabricantes.interface';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

@Injectable({ providedIn: 'root' })
export class FabricantesProvider extends ComandoProvider {
  private _arquivo: string = 'fabricantes.php';

  constructor(
    private servidor: ServidorProvider,
    sqlite: SQLite) {
    super('fabricantes', new IFabricantes(), sqlite);
  }

  excluir(): Observable<boolean> {
    return super.delete({ });
  }

  sincronizar(): Observable<IFabricantes[]> {
    return new Observable<IFabricantes[]>(
      subs => {
        this.servidor.get(this._arquivo).subscribe(
          (data) => {
            this.excluir().subscribe(() => {
              this.importJson(data).subscribe(
                () => {
                },
                err => {
                  alert('Erro na importação dos fabricantes: ' + err)
                },
                () => {
                    UtilProvider.completarObservable(subs, true);
                }
              );
            });
          },
          err => {
            alert('Erro fabricantes: ' + err);
            UtilProvider.completarObservable(subs, false);
          }
        );
      }
    );
  }
}
