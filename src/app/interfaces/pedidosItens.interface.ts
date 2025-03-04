import { IItens } from "./itens.interface";

export class IPedidosItens {
  pedCodigo: number = 0;
  sequencia: number = 0;
  iteCodigo: number = 0;
  quantidade: number = 0;
  qtdFat: number = 0;
  valor: number = 0; //valor bruto do produto
  valorUnitario: number = 0; //valor com desconto
  valorSt: number = 0;
  valorIpi: number = 0;
  baseSt: number = 0;
  desconto: number = 0;
  total: number = 0;
  ipi: number = 0;
  cst: string = '';
  aliqIcms: number = 0;
  item: IItens | null = null;
  imagePDF: string;
}
