import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';

export abstract class ConexaoProvider {
  private _conexao: SQLiteObject | undefined;
  mensagem = '';

  constructor(private _banco: SQLite) { }

  protected async conectar(): Promise<SQLiteObject> {
    console.log('_conexao', this._conexao);
    if (!(this._conexao instanceof SQLiteObject)) {
      this._conexao = await this._banco
        .create({
          name: 'data.db',
          location: 'default'
        });
    }
    console.log('conectar', this._conexao);
    return this._conexao;
  }
}
