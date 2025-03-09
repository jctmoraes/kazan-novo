import { Component, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { IClienteCadastro } from "@interfaces/cliente-cadastro.interface";
import { Subscription } from "rxjs";
import { ClienteCadastroProvider } from "@services/cliente-cadastro-provider";
import { ClientesProvider } from "@services/clientes-provider";
import { ClicadastradosProvider } from "@services/clicadastrados-provider";
import { UtilProvider } from "@services/util-provider";
import { IClientes } from "@interfaces/clientes.interface";
import { Router } from "@angular/router"; // Importação do Router

@Component({
  selector: "page-cliente-cadastro",
  templateUrl: "cliente-cadastro.html",
  styleUrls: ["cliente-cadastro.scss"],
  standalone: false,
})
export class ClienteCadastroPage implements OnDestroy {
  _formGroup: FormGroup;
  _fisJur: string;
  private observable: Subscription;
  isLoading: boolean = false;

  constructor(
    private clienteCadastroProvider: ClienteCadastroProvider,
    private clientesProvider: ClientesProvider,
    private cliCadastradosProvider: ClicadastradosProvider,
    private utilProvider: UtilProvider,
    private router: Router, // Substituição de viewCtrl por Router
    formBuilder: FormBuilder,
  ) {
    this._fisJur = "J";
    this._formGroup = formBuilder.group({
      fisJur: [this._fisJur],
      cgcCpf: [null, [Validators.required, Validators.minLength(14)]],
      inscRg: [null, [Validators.required]],
      razao: [null, [Validators.required]],
      endereco: [null, [Validators.required]],
      numEnd: [null, [Validators.required]],
      complemento: [null],
      bairro: [null, [Validators.required]],
      cidade: [null, [Validators.required]],
      estado: [null, [Validators.required]],
      cep: [null],
      fone1: [null, [Validators.required]],
      fone2: [null],
      fax: [null],
      contato: [null],
      codVen: [UtilProvider.funCodigo, [Validators.required]],
      email: [null, [Validators.required, Validators.email]],
      status: [null],
    });

    this.observable = this._formGroup
      .get("fisJur")
      .valueChanges.subscribe((tipo) => (this._fisJur = tipo));
  }

  ngOnDestroy() {
    if (this.observable) {
      this.observable.unsubscribe();
    }
  }

  async cadastrar() {
    if (this._formGroup.valid) {
      this.isLoading = true;
      const loading = await this.utilProvider.mostrarCarregando('CADASTRANDO...');

      let clienteCadastro = this._formGroup.value as IClienteCadastro;

      // Formatação dos números de telefone
      let fone1 = clienteCadastro.fone1;
      if (fone1 && fone1.length > 5) {
        let aux = fone1.replace(")", "").replace("(", "");
        clienteCadastro.fone1 = aux;
        clienteCadastro.ddd1 = aux.substring(0, 2);
      }

      let fone2 = clienteCadastro.fone2;
      if (fone2 && fone2.length > 5) {
        let aux = fone2.replace(")", "").replace("(", "");
        clienteCadastro.fone2 = aux;
        clienteCadastro.ddd2 = aux.substring(0, 2);
      }

      if (clienteCadastro.fax) {
        let fax = clienteCadastro.fax;
        clienteCadastro.fax = fax.replace(")", "").replace("(", "");
      }

      clienteCadastro.data = new Date();

      const cnpj = clienteCadastro.cgcCpf.replace(/[^\w\s]/gi, "");

      this.cliCadastradosProvider.buscarCliente(cnpj).subscribe((cli) => {
        if (cli !== undefined && cli !== null) {
          loading.dismiss();
          this.isLoading = false;
          alert(
            "CLIENTE JÁ CADASTRADO, ENTRAR EM CONTATO COM O DEPARTAMENTO DE CRÉDITO",
          );
        } else {
          const cliente: IClientes = this.mapClientesProvider(clienteCadastro);
          this.clientesProvider.salvar(cliente).subscribe((clienteId) => {
            // Adiciona o ID do cliente ao objeto `clienteCadastro` antes de enviar
            clienteCadastro.codCliente = clienteId;

            this.clienteCadastroProvider.enviar(clienteCadastro).subscribe(
              () => {
                loading.dismiss();
                this.isLoading = false;
                this._formGroup.reset();
                this.sair();
              },
              (err) => {
                loading.dismiss();
                this.isLoading = false;
                this.utilProvider.alerta(
                  "Ops",
                  "Não foi possível salvar o cliente",
                  () => {},
                );
                console.log(
                  "err",
                  JSON.stringify(err, Object.getOwnPropertyNames(err)),
                );
              },
            );
          });
        }
      });
    } else {
      console.log("Erro");
      console.log(this._formGroup.errors);
    }
  }

  sair() {
    this.router.navigate(["/master"]); // Substituição de viewCtrl.dismiss por router.navigate
  }

  async onBlur() {
    let cliente = this._formGroup.value as IClienteCadastro;
    const cnpj = cliente.cgcCpf.replace(/[^\w\s]/gi, "");

    this.cliCadastradosProvider.buscarCliente(cnpj).subscribe((cli) => {
      if (cli.cnpj !== undefined) {
        alert(
          "CLIENTE JÁ CADASTRADO, ENTRAR EM CONTATO COM O DEPARTAMENTO DE CRÉDITO",
        );
      }
    });

    if (this._fisJur === "J") {
      let loading = await this.utilProvider.mostrarCarregando(
        "BUSCANDO INFORMAÇÕES DO CLIENTE..."
      );
      this.clienteCadastroProvider.getTk().subscribe((k) => {
        this.clienteCadastroProvider.getInfoSintegra(cnpj, k.value).subscribe(
          (j) => {
            this._formGroup.get("razao").setValue(j.nome_empresarial);
            this._formGroup.get("inscRg").setValue(j.inscricao_estadual);
            this._formGroup.get("endereco").setValue(j.logradouro);
            this._formGroup.get("numEnd").setValue(j.numero);
            this._formGroup.get("complemento").setValue(j.complemento);
            this._formGroup.get("bairro").setValue(j.bairro);
            this._formGroup.get("cidade").setValue(j.municipio);
            this._formGroup.get("cep").setValue(j.cep);
            this._formGroup.get("estado").setValue(j.uf);
            this.utilProvider.esconderCarregando(loading);
          },
          (err) => {
            alert("ERRO AO BUSCAR INFORMAÇÕES NO SINTEGRA " + err);
          },
        );
      });
    }
  }

  private mapClientesProvider(clienteCadastro: IClienteCadastro): IClientes {
    const cliente: IClientes = new IClientes();
    cliente.codigo = clienteCadastro.codigo;
    cliente.nome = clienteCadastro.razao;
    cliente.endereco = clienteCadastro.endereco;
    cliente.numero = clienteCadastro.numEnd;
    cliente.bairro = clienteCadastro.bairro;
    cliente.cidade = clienteCadastro.cidade;
    cliente.estado = clienteCadastro.estado;
    cliente.cep = this.formataCEP(clienteCadastro.cep);
    cliente.cnpj = this.limpaCpfCnpj(clienteCadastro.cgcCpf);
    cliente.ie = clienteCadastro.inscRg;
    cliente.tipoPessoa = clienteCadastro.fisJur;
    cliente.venCodigo = Number(clienteCadastro.codVen);
    cliente.limite = 0;
    cliente.email = clienteCadastro.email;
    cliente.telefone = clienteCadastro.fone1;
    cliente.telefone2 = clienteCadastro.fone2 || "";
    cliente.fax = clienteCadastro.fax;
    cliente.contato = clienteCadastro.contato || "";
    cliente.telefoneContato = "";
    cliente.traCodigo = 1;
    cliente.cpgCodigo = "V01";
    cliente.bloqueado = 0;
    cliente.tipo = "R";
    cliente.totalReceber = 0;
    cliente.totalCheque = 0;
    cliente.vencidoReceber = 0;
    cliente.vencidoCheque = 0;
    return cliente;
  }

  private formataCEP(cep: string): string {
    return cep.replace(/[^\w\s]/gi, "");
  }

  private limpaCpfCnpj(cgcCpf: string): string {
    return cgcCpf.replace(/[^\w\s]/gi, "");
  }
}
