import { from, Observable } from "rxjs";
import { UtilProvider } from "../util-provider";
import { ConexaoProvider } from "./conexao-provider";
import { SQLite } from "@awesome-cordova-plugins/sqlite/ngx";
import { SQLitePorter } from "@awesome-cordova-plugins/sqlite-porter/ngx";

export class ComandoProvider extends ConexaoProvider {
  private _arrKeyObj: string[] = [];

  constructor(
    private nomeTabela: string,
    private objInterface: any,
    private banco: SQLite
  ) {
    super(banco);
    if (objInterface != null) this._arrKeyObj = Object.keys(objInterface);
  }

  protected importJson(json: any): Observable<void> {
    return from(this.importJsonPromise(json));
  }

  private async importJsonPromise(json: any): Promise<void> {
    const conexao = await this.conectar();
    const sqlitePorter = new SQLitePorter();
    await sqlitePorter.importJsonToDb(conexao, json).catch((e: any) => {
      console.error(JSON.stringify(e));
      console.log("Erro tab: " + this.nomeTabela);
    });
  }

  protected exportarJson(): Observable<any> {
    return from(this.exportarJsonPromise());
  }

  private async exportarJsonPromise(): Promise<any> {
    const conexao = await this.conectar();
    const sqlitePorter = new SQLitePorter();
    return await sqlitePorter.exportDbToJson(conexao).catch((e: any) => {
      console.error(JSON.stringify(e));
      console.log("Erro tab: " + this.nomeTabela);
    });
  }

  protected importSql(sql: string): Observable<any> {
    return from(this.importSqlPromise(sql));
  }

  protected async importSqlPromise(sql: string): Promise<any> {
    const conexao = await this.conectar();
    const sqlitePorter = new SQLitePorter();
    await sqlitePorter.importSqlToDb(conexao, sql).catch((e: any) => {
      console.error("criacao bd", JSON.stringify(e));
    });
  }

  protected executeSql(sql: string): Observable<any> {
    return from(this.executeSqlPromise(sql));
  }

  private async executeSqlPromise(sql: string): Promise<any> {
    const conexao = await this.conectar();
    return await conexao.executeSql(sql, []);
  }

  protected executeSqlEstoque(sql: string, params: any[] = []): Observable<any> {
    return from(this.executeSqlEstoquePromise(sql, params));
  }

  private async executeSqlEstoquePromise(sql: string, params: any[] = []): Promise<any> {
    const conexao = await this.conectar();
    return await conexao.executeSql(sql, params);
  }

  protected insert(objPreenchido: any): Observable<{ insertId: number; success: boolean; }> {
    return from(this.insertPromise(objPreenchido));
  }

  private async insertPromise(objPreenchido: any): Promise<{ insertId: number; success: boolean; }> {
    const conexao = await this.conectar();
    const campoValor = this.obterCampo(objPreenchido);
    const result = await conexao.executeSql(
      `INSERT INTO ${this.nomeTabela} (${campoValor[0]}) VALUES (${campoValor[1]})`,
      campoValor[2],
    );
    return { insertId: result.insertId, success: result.rowsAffected > 0 };
  }

  protected update(objAlteracao: any, condicao: any): Observable<boolean> {
    return from(this.updatePromise(objAlteracao, condicao));
  }

  private async updatePromise(objAlteracao: any, condicao: any): Promise<boolean> {
    const conexao = await this.conectar();
    let valor: any[] = [];
    let campo: string = "";
    const condicaoValor = this.obterCondicao(condicao);
    const arrKey = Object.keys(objAlteracao);
    for (let i = 0; i < arrKey.length; i++) {
      if (this.objInterface[arrKey[i]] != null) {
        if (!condicaoValor[1].includes(arrKey[i])) {
          if (campo != "") {
            campo += ",";
          }
          campo += `${arrKey[i]} = ?`;
          if (["data", "dtAlteracao", "dtEnvio"].includes(arrKey[i])) {
            valor.push(UtilProvider.formatarDataSql(objAlteracao[arrKey[i]]));
          } else {
            valor.push(objAlteracao[arrKey[i]]);
          }
        }
      }
    }
    valor = valor.concat(condicaoValor[1]);
    const result = await conexao.executeSql(`UPDATE ${this.nomeTabela} SET ${campo}${condicaoValor[0]}`, valor);
    return result.rowsAffected > 0;
  }

  protected select(condicao: any, ordem?: any): Observable<any> {
    return from(this.selectPromise(condicao, ordem));
  }

  private async selectPromise(condicao: any, ordem?: any): Promise<any> {
    const conexao = await this.conectar();
    const condicaoValor = this.obterCondicao(condicao);
    let order = "";
    if (ordem) {
      const arrKeyOrdem = Object.keys(ordem);
      order = " ORDER BY ";
      for (let i = 0; i < arrKeyOrdem.length; i++) {
        order += `${arrKeyOrdem[i]} ${ordem[arrKeyOrdem[i]]}`;
      }
    }
    console.log(`SELECT ${this.obterCampo()[0]} FROM ${this.nomeTabela}${condicaoValor[0]}${order}`);
    return await conexao.executeSql(
      `SELECT ${this.obterCampo()[0]} FROM ${this.nomeTabela}${condicaoValor[0]}${order}`,
      condicaoValor[1],
    );
  }

  protected selectPersonalizado(select: string, fromSql: string, where: string): Observable<any> {
    return from(this.selectPersonalizadoPromise(select, fromSql, where));
  }

  protected async selectPersonalizadoPromise(select: string, from: string, where: string): Promise<any> {
    const conexao = await this.conectar();
    return await conexao.executeSql(`SELECT ${select} FROM ${from} WHERE ${where}`, []);
  }

  protected selectMax(campo: string, condicao: any): Observable<number> {
    return from(this.selectMaxPromise(campo, condicao));
  }

  private async selectMaxPromise(campo: string, condicao: any): Promise<number> {
    const conexao = await this.conectar();
    const condicaoValor = this.obterCondicao(condicao);
    const result = await conexao.executeSql(
      `SELECT MAX(${campo}) AS max FROM ${this.nomeTabela}${condicaoValor[0]}`,
      condicaoValor[1],
    );
    return result.rows.item(0).max;
  }

  protected delete(condicao: any): Observable<boolean> {
    return from(this.deletePromise(condicao));
  }

  private async deletePromise(condicao: any): Promise<boolean> {
    const conexao = await this.conectar();
    const condicaoValor = this.obterCondicao(condicao);
    const result = await conexao.executeSql(`DELETE FROM ${this.nomeTabela}${condicaoValor[0]}`, condicaoValor[1]);
    return result.rowsAffected > 0;
  }

  protected selectCount(campo: string, condicao: any): Observable<number> {
    return from(this.selectCountPromise(campo, condicao));
  }

  private async selectCountPromise(campo: string, condicao: any): Promise<number> {
    const conexao = await this.conectar();
    let condicaoValor = this.obterCondicao(condicao);
    if (!condicao) condicaoValor = ["", []];
    const result = await conexao.executeSql(
      `SELECT COUNT(${campo}) AS count FROM ${this.nomeTabela}${condicaoValor[0]}`,
      condicaoValor[1],
    );
    return result.rows.item(0).count;
  }

  protected deletePersonalizado(condicao: string, valor: any[]): Observable<boolean> {
    return from(this.deletePersonalizadoPromise(condicao, valor));
  }

  private async deletePersonalizadoPromise(condicao: string, valor: any[]): Promise<boolean> {
    const conexao = await this.conectar();
    const result = await conexao.executeSql(`DELETE FROM ${this.nomeTabela} WHERE ${condicao}`, valor);
    return result.rowsAffected > 0;
  }

  private obterCondicao(condicao: any): [string, any[]] {
    let where = "";
    const valor: any[] = [];
    if (condicao != null) {
      const arrKeyCondicao = Object.keys(condicao);
      for (let i = 0; i < arrKeyCondicao.length; i++) {
        if (where == "") {
          where = " WHERE ";
        } else {
          where += " AND ";
        }
        where += `${arrKeyCondicao[i]} = ?`;
        valor.push(condicao[arrKeyCondicao[i]]);
      }
    }
    return [where, valor];
  }

  private obterCampo(objPreenchido?: any): [string, string, any[]] {
    let campo = "";
    const valor: any[] = [];
    let interrogacao = "";
    for (let i = 0; i < this._arrKeyObj.length; i++) {
      if (this.objInterface[this._arrKeyObj[i]] != null) {
        if (campo != "") {
          campo += ",";
          interrogacao += ",";
        }
        campo += this._arrKeyObj[i];
        interrogacao += "?";
        if (objPreenchido != null) {
          if (["data", "dtAlteracao", "dtEnvio"].includes(this._arrKeyObj[i])) {
            valor.push(UtilProvider.formatarDataSql(objPreenchido[this._arrKeyObj[i]]));
          } else {
            valor.push(objPreenchido[this._arrKeyObj[i]]);
          }
        }
      }
    }
    return [campo, interrogacao, valor];
  }
}
