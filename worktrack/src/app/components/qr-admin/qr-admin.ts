import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-qr-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-admin.html',
  styleUrl: './qr-admin.css',
})

export class QrAdmin implements OnInit {

  qrImage: any = '';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {

    this.obtenerQR();

  }

  obtenerQR() {

    this.http
      .get<any>('http://localhost:3000/qr/generar')
      .subscribe({

        next: (resp) => {

          this.qrImage =
            this.sanitizer.bypassSecurityTrustUrl(resp.qr);

        },

        error: (err) => {

          console.log(err);

        }

      });

  }

}