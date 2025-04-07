import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ServidorProvider } from '@services/servidor-provider';
import { UtilProvider } from '@services/util-provider';

@Component({
  selector: 'app-tabela-preco',
  templateUrl: 'tabela-preco.html',
  styleUrls: ['tabela-preco.scss'],
  standalone: false,
})
export class TabelaPrecoPage {
  _formGroup: FormGroup;
  envio = false;
  ufOrigem: string = 'SP';

  constructor(
    private formBuilder: FormBuilder,
    private utilProvider: UtilProvider,
    private servidorProvider: ServidorProvider,
    private router: Router
  ) {
  }

  ngOnInit() {
    this._formGroup = this.formBuilder.group({
      estoque: ['E', Validators.required],
      email: ['', Validators.required],
      ufOrigem: [this.ufOrigem ? this.ufOrigem : 'ufOrigem', Validators.required],
      ufDestino: ['ufDestino', Validators.required]
    });
  }

  ionViewDidLoad() {
    this.envio = false;
  }

  async enviar() {
    if (this._formGroup.valid) {
      let loading = await this.utilProvider.mostrarCarregando('Gerando e-mail...');
      this.envio = true;
      console.log(this._formGroup.value);
      this.servidorProvider
        .post('enviar-tabela.php', this._formGroup.value)
        .subscribe(() => {
          this.envio = false;
          this.utilProvider.esconderCarregando(loading);
          this.utilProvider.alerta(
            "ENVIO POR EMAIL",
            "TABELA ENVIADA COM SUCESSO!",
            () => {
            })
        });
    }
  }

  sair() {
    this.router.navigate(['/master']);
  }
}
