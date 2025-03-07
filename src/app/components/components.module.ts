import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from './header/header.component';
import { ModalHeaderComponent } from './modal/header/modal-header.component';

@NgModule({
  declarations: [HeaderComponent, ModalHeaderComponent],
  imports: [
    CommonModule,
    IonicModule.forRoot()
  ],
  exports: [HeaderComponent, ModalHeaderComponent]
})
export class ComponentsModule {}
