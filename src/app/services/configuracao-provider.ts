import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { HttpClient } from '@angular/common/http';

import { ServidorProvider } from "./servidor-provider";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { IConfiguracao } from '../interfaces/configuracao.interface';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoProvider extends ComandoProvider {
  private _arquivo: string = 'configuracao.php';

  constructor(
    private http: HttpClient,
    private servidor: ServidorProvider,
    private util: UtilProvider,
    sqlite: SQLite) {
    super('configuracao', new IConfiguracao(), sqlite);
  }

  buscar(): Observable<IConfiguracao> {
    return new Observable(subs =>  {
      super.select({ }).subscribe(
        (retorno) => {
          UtilProvider.completarObservable(subs, retorno.rows.item(0));
        }
      );
    });
  }

  excluir(): Observable<boolean> {
    return super.delete({ });
  }

  sincronizar(): Observable<IConfiguracao> {
    return new Observable<IConfiguracao>(
      subs => {
        this.servidor.get(this._arquivo).subscribe(
          (data: any) => {
            console.log('configuracao', data);
            this.excluir().subscribe(() => {
              this.importJson(data).subscribe(
                () => {
                },
                err => {
                  alert('Erro na importação dos itens: ' + err)
                },
                () => {
                    UtilProvider.completarObservable(subs, <IConfiguracao>data.data.inserts.configuracao[0]);
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
