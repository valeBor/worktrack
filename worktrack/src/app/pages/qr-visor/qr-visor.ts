import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import { CommonModule } from '@angular/common';
import { QrAdmin } from '../../components/qr-admin/qr-admin';

@Component({
  selector: 'app-qr-visor',
  standalone: true,
  imports: [Header, CommonModule, QrAdmin],
  templateUrl: './qr-visor.html',
  styleUrl: './qr-visor.css',
})
export class QrVisor {}
