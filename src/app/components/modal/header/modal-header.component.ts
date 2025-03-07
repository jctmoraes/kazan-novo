import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-modal-header',
  templateUrl: './modal-header.component.html',
  standalone: false,
})
export class ModalHeaderComponent {
  @Input() title: string;

  constructor(private modalController: ModalController) {}

  fechar() {
    this.modalController.dismiss();
  }
}
