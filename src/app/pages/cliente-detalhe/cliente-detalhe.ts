import { Component } from '@angular/core';
import { IClientes } from "../../interfaces/clientes.interface";
import { UtilProvider } from '@services/util-provider';
import { Router } from '@angular/router';
import { AbstractModalComponent } from 'src/app/components/modal/abstract-modal.component';
import { ModalController, Platform } from '@ionic/angular';

@Component({
  selector: 'app-cliente-detalhe',
  templateUrl: 'cliente-detalhe.html',
  styleUrls: ['cliente-detalhe.scss'],
  standalone: false,
})
export class ClienteDetalhePage extends AbstractModalComponent {
  _cliente: IClientes = new IClientes();

  constructor(
    private router: Router,
    public util: UtilProvider,
    modalCtrl: ModalController,
    platform: Platform,
  ) {
    super(modalCtrl, platform);
  }

  async ionViewDidEnter() {
    const htmlIonModalElement = await this.modalCtrl.getTop();
    const componentProps = htmlIonModalElement?.componentProps as { cliente: IClientes };
    this._cliente = componentProps?.cliente;
  }
}
