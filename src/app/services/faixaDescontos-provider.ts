import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

import { ServidorProvider } from "./servidor-provider";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { IFaixaDescontos } from '../interfaces/faixaDescontos';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

@Injectable({ providedIn: 'root' })
export class FaixaDescontosProvider extends ComandoProvider {
  private _arquivo: string = 'faixaDescontos.php';

  constructor(
    private servidor: ServidorProvider,
    sqlite: SQLite) {
    super('faixadescontos', new IFaixaDescontos(), sqlite);
  }

  buscar(codigo: number): Observable<IFaixaDescontos> {
    return new Observable(subs => {
      if (UtilProvider.objPedido != null && UtilProvider.objPedido.cliente != null) {
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
    return super.delete({});
  }

  sincronizar(): Observable<IFaixaDescontos[]> {
    return new Observable<IFaixaDescontos[]>(
      subs => {
        this.servidor.get(this._arquivo).subscribe(
          (data) => {
            this.excluir().subscribe(() => {
              this.importJson(data).subscribe(
                () => {
                },
                err => {
                  alert('Erro na importação das faixas de desconto: ' + err)
                },
                () => {
                  UtilProvider.completarObservable(subs, true);
                }
              );
            });
          },
          err => {
            alert('Erro faixa desconto: ' + err);
            UtilProvider.completarObservable(subs, false);
          }
        );
      }
    );
  }

  buscarFaixa(valor: number, filial: number): Observable<IFaixaDescontos> {
    console.log('valor: ', valor, ' filial: ', filial);
    return new Observable(
      subs => {
        let sql = 'SELECT * FROM faixadescontos WHERE ' + valor + ' BETWEEN valde AND valate AND filial=' + filial;

        super.executeSql(sql).subscribe(
          (retorno) => {
            let obj: IFaixaDescontos | null = null;
            if (retorno.rows.length > 0) {
              obj = this.preencherObjeto(retorno.rows.item(0));
            }
            UtilProvider.completarObservable(subs, obj);
          }
        );
      }
    );
  }

  private preencherObjeto(linha: any): IFaixaDescontos {
    //console.log('linha: ', JSON.stringify(linha));
    return <IFaixaDescontos>linha;
  }
}
