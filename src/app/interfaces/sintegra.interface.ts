export class CnaePrincipal {
  code: string = '';
  text: string = '';
}

export class IInfoSintegra {
  code: string = '';
  status: string = '';
  message: string = '';
  nome_empresarial: string = '';
  cnpj: string = '';
  inscricao_estadual: string = '';
  tipo_inscricao: string = '';
  data_situacao_cadastral: string = '';
  situacao_cnpj: string = '';
  situacao_ie: string = '';
  nome_fantasia: string = '';
  data_inicio_atividade: string = '';
  regime_tributacao: string = '';
  informacao_ie_como_destinatario: string = '';
  porte_empresa: string = '';
  cnae_principal: CnaePrincipal;
  data_fim_atividade: string = '';
  uf: string = '';
  municipio: string = '';
  logradouro: string = '';
  complemento: string = '';
  cep: string = '';
  numero: string = '';
  bairro: string = '';
}

export class IToken {
  value: string = '';
}
