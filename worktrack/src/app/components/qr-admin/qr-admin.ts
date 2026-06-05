import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-qr-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-admin.html',
  styleUrl: './qr-admin.css',
})

export class QrAdmin implements OnInit, OnDestroy {

  qrImage!: string;

  private intervalo?: ReturnType<typeof setInterval>;

  ngOnInit(): void {

    this.actualizarQR();

    this.intervalo = setInterval(() => {

      this.actualizarQR();

    }, 10000); // cada 10 segundos

  

  }

  actualizarQR(): void {

    this.qrImage =
       `http://localhost:3000/qr/generar?t=${Date.now()}`;

         console.log("Qr actualizado", this.qrImage);

  }

  ngOnDestroy(): void {

    if (this.intervalo){
    clearInterval(this.intervalo);
    }

  }

}