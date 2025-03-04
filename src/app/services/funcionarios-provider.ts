import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SQLite } from "@awesome-cordova-plugins/sqlite/ngx";
import { ServidorProvider } from "./servidor-provider";
import { UtilProvider } from "./util-provider";
import { ComandoProvider } from "./banco/comando-provider";
import { IFuncionarios } from "../interfaces/funcionarios.interface";
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FuncionariosProvider extends ComandoProvider {
  private _arquivo: string = "vendedores.php";
  public filialCod: number = 0;

  constructor(
    private servidorProvider: ServidorProvider,
    sqlite: SQLite,
    private http: HttpClient
  ) {
    super("funcionarios", new IFuncionarios(), sqlite);
  }

  salvar(funcionario: IFuncionarios): Observable<boolean> {
    return new Observable((subs) => {
      this.insert(funcionario).subscribe(
        (retorno: { insertId: number; success: boolean }) => {
          UtilProvider.completarObservable(subs, retorno.success);
        },
      );
    });
  }

  alterar(funcionario: IFuncionarios): Observable<boolean> {
    return new Observable((subs) => {
      this.update(funcionario, { codigo: funcionario.codigo }).subscribe(
        (retorno: boolean) => {
          UtilProvider.completarObservable(subs, retorno);
        },
      );
    });
  }

  autenticarApi(codigo: number, senha: string): Observable<IFuncionarios> {
    return this.servidorProvider.get(
      `${this._arquivo}?codigo=${codigo}&senha=${senha}`,
    )
    .pipe(map((data: any) => data as IFuncionarios));
  }

  autenticar(codigo: number, senha: string): Observable<IFuncionarios> {
    return new Observable((subs) => {
      super.select({ codigo: codigo, senha: senha }).subscribe((retorno) => {
        let funcionario: IFuncionarios | null = null;
        if (retorno.rows.length > 0) {
          funcionario = this.preencherObjeto(retorno.rows.item(0));
        }
        UtilProvider.completarObservable(subs, funcionario);
      });
    });
  }

  buscarLogado(): Observable<IFuncionarios> {
    return new Observable((subs) => {
      super.select({ logado: true }).subscribe((retorno) => {
        let funcionario: IFuncionarios | null = null;
        if (retorno.rows.length > 0) {
          funcionario = this.preencherObjeto(retorno.rows.item(0));
          if (this.filialCod == null) {
            this.filialCod = funcionario.filial;
          } else {
            funcionario.filial = this.filialCod;
          }
        }
        UtilProvider.completarObservable(subs, funcionario);
      });
    });
  }

  atualizaFilialCod(novaFilialCod: number) {
    this.filialCod = novaFilialCod;
  }

  alterarLogado(): Observable<boolean> {
    return super.update({ logado: false }, null);
  }

  porCodigo(
    codigo: number,
    empresa: number,
    banco: string,
  ): Observable<IFuncionarios> {
    return new Observable((subs) => {
      super
        .select({ codigo: codigo, empresa: empresa, banco: banco })
        .subscribe((retorno) => {
          let funcionario: IFuncionarios | null = null;
          if (retorno.rows.length > 0) {
            funcionario = this.preencherObjeto(retorno.rows.item(0));
          }
          UtilProvider.completarObservable(subs, funcionario);
        });
    });
  }

  buscar(): Observable<IFuncionarios[]> {
    return new Observable((subs) => {
      super.select(null).subscribe((retorno) => {
        let lstObj: IFuncionarios[] = this.preencherObjetoList(retorno.rows);
        UtilProvider.completarObservable(subs, lstObj);
      });
    });
  }

  excluir(banco: number): Observable<boolean> {
    return super.delete({ banco: banco });
  }

  sincronizar(
    banco: string,
    funCodigoLogado: number,
  ): Observable<boolean> {
    let codBanco = UtilProvider.obterCodigoBanco(banco);
    return new Observable<boolean>((subs) => {
      this.servidorProvider
        .get(`${this._arquivo}?banco=${banco}&funCodigoLogado=${funCodigoLogado}`)
        .subscribe(
          (data) => {
            this.excluir(codBanco).subscribe(() => {
              this.importJson(data).subscribe(
                () => {},
                (err) => {
                  alert("Erro na importação dos funcionários. Erro: " + err);
                },
                () => {
                  UtilProvider.completarObservable(subs, true);
                },
              );
            });
          },
          (err) => {
            alert(
              "Erro: " +
                err +
                " parametros: " +
                this._arquivo +
                "?banco=" +
                banco +
                "&funCodigoLogado=" +
                funCodigoLogado,
            );
          },
        );
    });
  }

  private preencherObjetoList(linhas: any): IFuncionarios[] {
    if (linhas.length > 0) {
      let lstRetorno = new Array<IFuncionarios>();
      for (let i = 0; i < linhas.length; i++) {
        lstRetorno.push(this.preencherObjeto(linhas.item(i)));
      }
      return lstRetorno;
    } else {
      return [];
    }
  }

  private preencherObjeto(linha: any): IFuncionarios {
    return <IFuncionarios>linha;
  }
}

