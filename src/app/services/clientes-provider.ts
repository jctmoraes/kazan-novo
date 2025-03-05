import { Injectable } from "@angular/core";
import { ServidorProvider } from "./servidor-provider";
import { Observable, Subscriber } from "rxjs";
import { IClientes } from "../interfaces/clientes.interface";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { HttpClient } from "@angular/common/http";
import { SQLite } from "@awesome-cordova-plugins/sqlite/ngx";

@Injectable({ providedIn: 'root' })
export class ClientesProvider extends ComandoProvider {
  private _arquivo: string = "clientes.php?codigo=";
  // private _arquivo: string = '/_CLIENTES.TXT';

  constructor(
    public http: HttpClient,
    private servidor: ServidorProvider,
    sqlite: SQLite
  ) {
    super("clientes", new IClientes(), sqlite);
  }

  salvar(cliente: IClientes): Observable<number> {
    return new Observable((subs) => {
      this.insert(cliente).subscribe(
        (retorno: { insertId: number; success: boolean }) => {
          // Verifica se a inserção foi bem-sucedida e retorna o insertId
          if (retorno && retorno.success) {
            UtilProvider.completarObservable(subs, retorno.insertId);
          } else {
            // Em caso de falha, completa com um valor indicativo, como -1
            UtilProvider.completarObservable(subs, -1);
          }
        },
      );
    });
  }

  alterar(cliente: IClientes): Observable<boolean> {
    return new Observable((subs) => {
      this.update(cliente, { codigo: cliente.codigo }).subscribe(
        (retorno: boolean) => {
          UtilProvider.completarObservable(subs, retorno);
        },
      );
    });
  }

  porCodigo(codigo: number): Observable<IClientes> {
    return new Observable((subs) => {
      super.select({ codigo: codigo }).subscribe((retorno) => {
        let cliente: IClientes | null = null;
        if (retorno.rows.length > 0) {
          cliente = this.preencherObjeto(retorno.rows.item(0));
        }
        UtilProvider.completarObservable(subs, cliente);
      });
    });
  }

  buscar(
    venCodigo: number,
    filtro: string,
    inicio: number,
    qtd: number,
    total: boolean,
  ): Observable<IClientes[]> {
    return new Observable((subs) => {
      let select = "SELECT ";
      let from = " FROM clientes";
      let where = " WHERE venCodigo = " + venCodigo;

      if (total) select += " COUNT(codigo) AS qtd";
      else
        select +=
          " codigo, nome, endereco, bairro, cidade, estado, cep, cnpj, ie, tipoPessoa, venCodigo, limite, email, telefone, telefone2, fax, contato, telefoneContato, traCodigo, cpgCodigo, bloqueado, totalReceber, totalCheque, vencidoReceber, vencidoCheque";

      if (filtro != "") {
        let filtroCodigo = "";
        if (UtilProvider.validarNumero(filtro)) {
          filtroCodigo = "codigo = " + filtro + " OR";
        }
        where +=
          " AND (" +
          filtroCodigo +
          " nome LIKE '%" +
          filtro +
          "%' OR cnpj LIKE '%" +
          filtro +
          "%' OR email LIKE '%" +
          filtro +
          "%' )";
      }

      if (!total) {
        where += " ORDER BY nome ASC";
        where += " LIMIT " + inicio + ", " + qtd;
      }
      super.executeSql(select + from + where).subscribe((retorno) => {
        if (total)
          UtilProvider.completarObservable(subs, retorno.rows.item(0).qtd);
        else this.preencherObjetoList(retorno.rows, subs);
      });
    });
  }

  buscarAtivos(
    venCodigo: number,
    filtro: string,
    inicio: number,
    qtd: number,
  ): Observable<IClientes[]> {
    return new Observable((subs) => {
      let select =
        "SELECT codigo, nome, endereco, bairro, cidade, estado, cep, cnpj, ie, tipoPessoa, venCodigo, limite, email, telefone, telefone2, fax, contato, telefoneContato, traCodigo, cpgCodigo, bloqueado, totalReceber, totalCheque, vencidoReceber, vencidoCheque";
      let from = " FROM clientes";
      let where = " WHERE venCodigo = " + venCodigo + " AND bloqueado = 0";

      if (filtro != "") {
        let filtroCodigo = "";
        if (UtilProvider.validarNumero(filtro)) {
          filtroCodigo = "codigo = " + filtro + " OR";
        }
        where +=
          " AND (" +
          filtroCodigo +
          " nome LIKE '%" +
          filtro +
          "%' OR cnpj LIKE '%" +
          filtro +
          "%' OR email LIKE '%" +
          filtro +
          "%' )";
      }

      where += " ORDER BY nome ASC";
      where += " LIMIT " + inicio + ", " + qtd;

      super.executeSql(select + from + where).subscribe((retorno) => {
        this.preencherObjetoList(retorno.rows, subs);
      });
    });
  }

  buscarInativos(
    venCodigo: number,
    filtro: string,
    inicio: number,
    qtd: number,
  ): Observable<IClientes[]> {
    return new Observable((subs) => {
      let select =
        "SELECT codigo, nome, endereco, bairro, cidade, estado, cep, cnpj, ie, tipoPessoa, venCodigo, limite, email, telefone, telefone2, fax, contato, telefoneContato, traCodigo, cpgCodigo, bloqueado, totalReceber, totalCheque, vencidoReceber, vencidoCheque";
      let from = " FROM clientes";
      let where = " WHERE venCodigo = " + venCodigo + " AND bloqueado = 1";

      if (filtro != "") {
        let filtroCodigo = "";
        if (UtilProvider.validarNumero(filtro)) {
          filtroCodigo = "codigo = " + filtro + " OR";
        }
        where +=
          " AND (" +
          filtroCodigo +
          " nome LIKE '%" +
          filtro +
          "%' OR cnpj LIKE '%" +
          filtro +
          "%' OR email LIKE '%" +
          filtro +
          "%' )";
      }

      where += " ORDER BY nome ASC";
      where += " LIMIT " + inicio + ", " + qtd;

      super.executeSql(select + from + where).subscribe((retorno) => {
        this.preencherObjetoList(retorno.rows, subs);
      });
    });
  }

  buscarTotalAtivos(venCodigo: number, filtro: string): Observable<number> {
    return new Observable((subs) => {
      let select = "SELECT COUNT(codigo) AS qtd";
      let from = " FROM clientes";
      let where = " WHERE venCodigo = " + venCodigo + " AND bloqueado = 0";

      if (filtro != "") {
        let filtroCodigo = "";
        if (UtilProvider.validarNumero(filtro)) {
          filtroCodigo = "codigo = " + filtro + " OR";
        }
        where +=
          " AND (" +
          filtroCodigo +
          " nome LIKE '%" +
          filtro +
          "%' OR cnpj LIKE '%" +
          filtro +
          "%' OR email LIKE '%" +
          filtro +
          "%' )";
      }
      console.log(select + from + where);
      super.executeSql(select + from + where).subscribe((retorno) => {
        UtilProvider.completarObservable(subs, retorno.rows.item(0).qtd);
      });
    });
  }

  buscarTotalInativos(venCodigo: number, filtro: string): Observable<number> {
    return new Observable((subs) => {
      let select = "SELECT COUNT(codigo) AS qtd";
      let from = " FROM clientes";
      let where = " WHERE venCodigo = " + venCodigo + " AND bloqueado = 1";

      if (filtro != "") {
        let filtroCodigo = "";
        if (UtilProvider.validarNumero(filtro)) {
          filtroCodigo = "codigo = " + filtro + " OR";
        }
        where +=
          " AND (" +
          filtroCodigo +
          " nome LIKE '%" +
          filtro +
          "%' OR cnpj LIKE '%" +
          filtro +
          "%' OR email LIKE '%" +
          filtro +
          "%' )";
      }

      super.executeSql(select + from + where).subscribe((retorno) => {
        UtilProvider.completarObservable(subs, retorno.rows.item(0).qtd);
      });
    });
  }

  buscarQuantidade(funCodigo: number, banco: number): Observable<number> {
    return new Observable((subs) => {
      super
        .selectCount("codigo", { funCodigo: funCodigo, banco: banco })
        .subscribe((retorno) => {
          UtilProvider.completarObservable(subs, retorno);
        });
    });
  }

  excluir(venCodigo: number): Observable<boolean> {
    return super.delete({ venCodigo: venCodigo });
  }

  sincronizar(venCodigo: number): Observable<IClientes[]> {
    return new Observable<IClientes[]>((subs) => {
      this.servidor.get(this._arquivo + venCodigo).subscribe(
        (data: any) => {
          this.buscaTodosClientesSqlite(venCodigo).subscribe(
            (retorno) => {
              for (let i = 0; i < retorno.rows.length; i++) {
                const clienteEncontrado = data.data.inserts.clientes.filter(
                  (cliente: any) => this.existeCnpj(cliente, retorno.rows.item(i)),
                );

                if (clienteEncontrado.length === 0) {
                  data.data.inserts.clientes.push(retorno.rows.item(i));
                }
              }

              this.excluir(venCodigo).subscribe(() => {
                this.importJson(data).subscribe(
                  () => {
                    //alert('clientes importados')
                  },
                  (err) => {
                    alert("Erro na importação de clientes: " + err);
                  },
                  () => {
                    UtilProvider.completarObservable(subs, true);
                  },
                );
              });
            },
            (err) => {
              alert("Erro na importação de clientes: " + err);
              UtilProvider.completarObservable(subs, false);
            },
          );
        },
        (err) => {
          alert("Erro na importação de clientes: " + err);
          UtilProvider.completarObservable(subs, false);
        },
      );
    });
  }

  private preencherObjetoList(linhas: any, subscriber: Subscriber<IClientes[]>) {
    if (linhas.length > 0) {
      let lstRetorno = new Array<IClientes>();
      for (let i = 0; i < linhas.length; i++) {
        let obj = this.preencherObjeto(linhas.item(i));
        lstRetorno.push(obj);
        if (lstRetorno.length == linhas.length) {
          UtilProvider.completarObservable(subscriber, lstRetorno);
        }
      }
    } else {
      UtilProvider.completarObservable(subscriber, new Array<IClientes>());
    }
  }

  buscaTodosClientesSqlite(venCodigo: number): Observable<any> {
    return new Observable((subs) => {
      super
        .selectPersonalizado("*", "clientes", "venCodigo = " + venCodigo)
        .subscribe((retorno) => {
          UtilProvider.completarObservable(subs, retorno);
        });
    });
  }

  private preencherObjeto(linha: any): IClientes {
    return <IClientes>linha;
  }

  private existeCnpj(clienteApi: any, clienteSqlite: any): boolean {
    return (
      clienteApi.cnpj != null &&
      clienteApi.cnpj.toString().length > 1 &&
      clienteApi.cnpj == clienteSqlite.cnpj
    );
  }
}
