import { Injectable } from '@angular/core';
import { Observable } from "rxjs";


import { ServidorProvider } from "./servidor-provider";
import { ICodigoBarras } from "../interfaces/codigoBarras.interface";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { HttpClient } from '@angular/common/http';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

@Injectable({ providedIn: 'root' })
export class CodigoBarrasProvider extends ComandoProvider {
  private _arquivo: string = 'codigoBarras.php';

  constructor(
    private http: HttpClient,
    private servidor: ServidorProvider,
    private util: UtilProvider,
    sqlite: SQLite) {
    super('codigoBarras', new ICodigoBarras(), sqlite);
  }

  excluir(): Observable<boolean> {
    return super.delete({ });
  }

  sincronizar(): Observable<ICodigoBarras[]> {
    return new Observable<ICodigoBarras[]>(
      subs => {
        this.servidor.get(this._arquivo).subscribe(
          (data) => {
            this.excluir().subscribe(() => {
              this.importJson(data).subscribe(
                () => {
                },
                err => {
                  alert('Erro na importação dos cód. barras: ' + err)
                },
                () => {
                    UtilProvider.completarObservable(subs, true);
                }
              );
            });
          },
          err => {
            alert('Erro cód. barras: ' + err);
            UtilProvider.completarObservable(subs, false);
          }
        );
      }
    );
  }
}
