import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-top-tiles',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  templateUrl: './top-tiles.component.html',
  styleUrls: ['./top-tiles.component.css'],
})
export class TopTilesComponent {
  @Input() item: any;
}
