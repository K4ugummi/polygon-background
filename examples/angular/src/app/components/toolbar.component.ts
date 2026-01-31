import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolygonBackground } from 'polygon-background';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container class="toolbar">
      <div class="toolbar-content">
        <div class="toolbar-left">
          <button class="hamburger" (click)="menuOpen = !menuOpen">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h4>My Application</h4>
        </div>
        <div class="toolbar-right">
          <button class="icon-btn">🔔</button>
          <button class="icon-btn">👤</button>
        </div>
      </div>
      <div *ngIf="menuOpen" class="menu">
        <button *ngFor="let item of menuItems" class="menu-item">
          {{ item }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toolbar {
      position: relative;
      border-radius: 0.5rem;
      overflow: hidden;
      width: 100%;
      max-width: 600px;
      min-height: 60px;
    }

    .toolbar-content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .toolbar-left h4 {
      color: #fff;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .hamburger {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .hamburger span {
      display: block;
      width: 20px;
      height: 2px;
      background: #fff;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .icon-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      color: #fff;
      cursor: pointer;
      font-size: 1rem;
    }

    .menu {
      position: relative;
      z-index: 1;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.5rem;
    }

    .menu-item {
      display: block;
      width: 100%;
      text-align: left;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      color: #fff;
      cursor: pointer;
      border-radius: 0.25rem;
    }

    .menu-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  `],
})
export class ToolbarComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;

  menuOpen = false;
  menuItems = ['Dashboard', 'Settings', 'Profile', 'Logout'];

  private bg: PolygonBackground | null = null;

  ngAfterViewInit() {
    if (this.containerRef) {
      this.bg = new PolygonBackground(this.containerRef.nativeElement, {
        theme: 'ocean',
        pointCount: 25,
        speed: 0.2,
      });
    }
  }

  ngOnDestroy() {
    this.bg?.destroy();
  }
}
