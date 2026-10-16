import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-index-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './index-view.html',
  styleUrls: ['./index-view.scss']
})
export class IndexViewComponent {}