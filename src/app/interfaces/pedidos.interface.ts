import { IClientes } from "./clientes.interface";
import { ITransportadoras } from "./transportadoras.interface";
import { ICondicaoPagto } from "./condicaoPagto.interface";
import { IPedidosItens } from "./pedidosItens.interface";

export class IPedidos {
  codigo: number = 0;
  data: Date = new Date();
  venCodigo: number = 0;
  traCodigo: number = 0;
  cliCodigo: number = 0;
  cpgCodigo: string = "";
  valor: number = 0;
  status: number = 0; //1 = não enviado, 2 = enviado
  desconto: number = 0;
  dtAlteracao: Date | null = null;
  dtEnvio: Date | null = null;
  observacao: string = "";
  numero: number = 0; //numero do pedido no servidor
  frete: string = "";
  valorSubTotal: number = 0;
  valorIpi: number = 0;
  valorSt: number = 0;
  baseSt: number = 0;
  valorDesconto: number = 0;
  cliente: IClientes | null = null;
  transportadora: ITransportadoras | null = null;
  condicaoPagto: ICondicaoPagto | null = null;
  pedidosItens: IPedidosItens[] = [];
  incluirImagens?: boolean;
  contatoVendedor?: string;
  nomevendedor?: string;
  pedidoEmail?: string;
  emailInformado?: string;
}

export class IPedidosGeral extends IPedidos {
  filial?: number = 0;
  nomeFilial?: string = '';
}

export function mapPedidosGeral(
  pedido: IPedidos,
  filial: number
): IPedidosGeral {
  return {
    codigo: pedido.codigo,
    data: pedido.data,
    venCodigo: pedido.venCodigo,
    traCodigo: pedido.traCodigo,
    cliCodigo: pedido.cliCodigo,
    cpgCodigo: pedido.cpgCodigo,
    valor: pedido.valor,
    status: pedido.status,
    desconto: pedido.desconto,
    dtAlteracao: pedido.dtAlteracao!,
    dtEnvio: pedido.dtEnvio,
    observacao: pedido.observacao,
    numero: pedido.numero,
    frete: pedido.frete,
    valorSubTotal: pedido.valorSubTotal,
    valorIpi: pedido.valorIpi,
    valorSt: pedido.valorSt,
    baseSt: pedido.baseSt,
    valorDesconto: pedido.valorDesconto,
    cliente: pedido.cliente,
    transportadora: pedido.transportadora,
    condicaoPagto: pedido.condicaoPagto,
    pedidosItens: pedido.pedidosItens,
    filial: filial,
    incluirImagens: pedido.incluirImagens,
    contatoVendedor: pedido.contatoVendedor,
    nomevendedor: pedido.nomevendedor,
  };
}
