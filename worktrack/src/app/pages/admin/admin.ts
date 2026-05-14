import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-admin',
  standalone:true,
  imports: [CommonModule, FormsModule, RouterModule, Header],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {

constructor(private router: Router){}

irAEmployees(){
  this.router.navigate(['/employee-list']);
}
 

  
}
