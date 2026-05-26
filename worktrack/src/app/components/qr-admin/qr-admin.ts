import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-qr-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-admin.html',
  styleUrl: './qr-admin.css',
})

export class QrAdmin {

  qrImage: string =
    'http://localhost:3000/qr/generar';

}