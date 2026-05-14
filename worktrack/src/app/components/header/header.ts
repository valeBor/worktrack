import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { threadId } from 'worker_threads';

@Component({
  selector: 'app-header',
  imports: [FormsModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {

role="";
fecha="";

ngOnInit(){
    
    this.role= localStorage.getItem('role') || '';
    this.fecha= new Date().toLocaleDateString(); 


}

logout(){
  localStorage.clear();
}




}
