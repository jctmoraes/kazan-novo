import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SelecionaFilialComponent } from './seleciona-filial/seleciona-filial';
import { HomePage } from './home/home.page';
import { CarrinhoPage } from './carrinho/carrinho';
import { ClientePage } from './cliente/cliente';
import { ClienteCadastroPage } from './cliente-cadastro/cliente-cadastro';
import { ClienteDetalhePage } from './cliente-detalhe/cliente-detalhe';
import { CondicaoPagtoPage } from './condicao-pagto/condicao-pagto';
import { FaleConoscoPage } from './fale-conosco/fale-conosco';
import { PedidoFiltroPage } from './filtro/pedido-filtro/pedido-filtro';
import { FinalizaPedidoPage } from './finaliza-pedido/finaliza-pedido';
import { MasterPage } from './master/master';
import { PedidoDetalhePage } from './pedido-detalhe/pedido-detalhe';
import { PedidoEmailPage } from './pedido-email/pedido-email';
import { ProdutoPage } from './produto/produto';
import { ProdutoDetalhePage } from './produto-detalhe/produto-detalhe';
import { ProdutoQtdPage } from './produto-qtd/produto-qtd';
import { TabelaPrecoPage } from './tabela-preco/tabela-preco';
import { TransportadoraPage } from './transportadora/transportadora';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomePage,
  },
  {
    path: 'carrinho',
    component: CarrinhoPage,
  },
  {
    path: 'cliente',
    component: ClientePage,
  },
  {
    path: 'cliente-cadastro',
    component: ClienteCadastroPage,
  },
  {
    path: 'cliente-detalhe',
    component: ClienteDetalhePage,
  },
  {
    path: 'condicao-pagto',
    component: CondicaoPagtoPage,
  },
  {
    path: 'fale-conosco',
    component: FaleConoscoPage,
  },
  {
    path: 'filtro/pedido',
    component: PedidoFiltroPage,
  },
  {
    path: 'finaliza-pedido',
    component: FinalizaPedidoPage,
  },
  {
    path: 'master',
    component: MasterPage,
  },
  {
    path: 'pedido',
    component: PedidoFiltroPage,
  },
  {
    path: 'pedido-detalhe/:pedido',
    component: PedidoDetalhePage,
  },
  {
    path: 'pedido-email',
    component: PedidoEmailPage,
  },
  {
    path: 'pedido-panilha',
    component: PedidoDetalhePage,
  },
  {
    path: 'produto',
    component: ProdutoPage,
  },
  {
    path: 'produto-detalhe',
    component: ProdutoDetalhePage,
  },
  {
    path: 'produto-qtd',
    component: ProdutoQtdPage,
  },
  {
    path: 'seleciona-filial',
    component: SelecionaFilialComponent,
  },
  {
    path: 'tabela-preco',
    component: TabelaPrecoPage,
  },
  {
    path: 'transportadora',
    component: TransportadoraPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PageRoutingModule {}
