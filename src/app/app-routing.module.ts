import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { SelecionaFilialComponent } from './pages/seleciona-filial/seleciona-filial';
import { HomePage } from './pages/home/home.page';
import { CarrinhoPage } from './pages/carrinho/carrinho';
import { ClientePage } from './pages/cliente/cliente';
import { ClienteCadastroPage } from './pages/cliente-cadastro/cliente-cadastro';
import { ClienteDetalhePage } from './pages/cliente-detalhe/cliente-detalhe';
import { CondicaoPagtoPage } from './pages/condicao-pagto/condicao-pagto';
import { FaleConoscoPage } from './pages/fale-conosco/fale-conosco';
import { PedidoFiltroPage } from './pages/filtro/pedido-filtro/pedido-filtro';
import { FinalizaPedidoPage } from './pages/finaliza-pedido/finaliza-pedido';
import { MasterPage } from './pages/master/master';
import { PedidoDetalhePage } from './pages/pedido-detalhe/pedido-detalhe';
import { PedidoEmailPage } from './pages/pedido-email/pedido-email';
import { ProdutoPage } from './pages/produto/produto';
import { ProdutoDetalhePage } from './pages/produto-detalhe/produto-detalhe';
import { ProdutoQtdPage } from './pages/produto-qtd/produto-qtd';
import { TabelaPrecoPage } from './pages/tabela-preco/tabela-preco';
import { TransportadoraPage } from './pages/transportadora/transportadora';
import { PedidoPage } from './pages/pedido/pedido';
import { PedidoPlanilhaPage } from './pages/pedido-planilha/pedido-planilha';

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
    path: 'clientes',
    component: ClientePage,
  },
  {
    path: 'pedido/clientes',
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
    path: 'pedidos',
    component: PedidoPage,
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
    component: PedidoPlanilhaPage,
  },
  {
    path: 'produtos',
    component: ProdutoPage,
  },
  {
    path: 'pedido/produtos',
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
    path: 'transportadoras',
    component: TransportadoraPage,
  },
  {
    path: 'pedido/transportadoras',
    component: TransportadoraPage,
  },
  {
    path: 'pedido/condicao-pagto',
    component: CondicaoPagtoPage,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
