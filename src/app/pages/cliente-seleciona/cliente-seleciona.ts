import { Component } from '@angular/core';
import { IClientes } from '@interfaces/clientes.interface';
import { ClientesProvider } from '@services/clientes-provider';
import { UtilProvider } from '@services/util-provider';
import { Router } from '@angular/router';
import { InfiniteScrollCustomEvent } from '@ionic/angular';

@Component({
  selector: 'app-cliente',
  templateUrl: 'cliente-seleciona.html',
  styleUrls: ['cliente-seleciona.scss'],
  standalone: false,
})
export class ClienteSelecionaPage {
  _lstClientes: IClientes[] = [];
  _pagina: number = -1; //início da páginação
  _qtdPorPagina: number = 30; //quantidade de registros a serem carregandos
  _carregando: boolean = false;
  _filtro: string = '';
  _qtdTotal: number = -1;
  _funCodigo: number = 0;

  constructor(
    private router: Router,
    private cliente: ClientesProvider) {
    this._funCodigo = UtilProvider.funCodigo;
  }

  pesquisar() {
      this._pagina = -1;
      this._lstClientes = [];
      this.proxima();
  }

  proxima() {
    this._carregando = true;
    this._pagina++;
    let inicio = this._pagina * this._qtdPorPagina;
    const codigoTodosClientes = 0;

    if(this._pagina == 0) {
      this.cliente.buscar(codigoTodosClientes, this._filtro, 0, 0, true).subscribe(
        (qtdTotal) => {
          this._qtdTotal = Number(qtdTotal);
        }
      );
    }
    //let fim = inicio + this._qtdPorPagina;
    this.cliente.buscar(codigoTodosClientes, this._filtro, inicio, this._qtdPorPagina, false).subscribe(
      (retorno: IClientes[]) => {
        if(retorno.length > 0) {
          this._lstClientes = this._lstClientes.concat(retorno);
          this._carregando = false;
        }
        this._carregando = false;
      },
      err => { alert('Erro ao buscar os produtos'); }
    );
  }

  selecionar(cliente: IClientes) {
    this.router.navigate(['..'], { state: { cliente: cliente } });
  }

  cancelar() {
    this.router.navigate(['..']);
  }

  doInfinite(infiniteScroll: InfiniteScrollCustomEvent) {
    this._carregando = true;
    this.proxima();
    infiniteScroll.target.complete();
  }
}
