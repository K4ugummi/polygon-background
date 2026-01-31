import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolygonBackground } from 'polygon-background';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open" class="overlay" (click)="close.emit()">
      <div #container class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog-content">
          <div class="dialog-icon">⚠️</div>
          <h3>Delete Project?</h3>
          <p>This action cannot be undone. All data associated with this project will be permanently removed.</p>
          <div class="dialog-actions">
            <button class="btn-secondary" (click)="close.emit()">Cancel</button>
            <button class="btn-danger" (click)="close.emit()">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog {
      position: relative;
      border-radius: 1rem;
      overflow: hidden;
      padding: 2rem;
      max-width: 400px;
      width: 90%;
      min-height: 280px;
    }

    .dialog-content {
      position: relative;
      z-index: 1;
      text-align: center;
    }

    .dialog-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .dialog-content h3 {
      color: #fff;
      margin-bottom: 0.5rem;
    }

    .dialog-content p {
      color: #94a3b8;
      margin-bottom: 1.5rem;
    }

    .dialog-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      border: 1px solid #334155;
      background: transparent;
      color: #fff;
      font-size: 1rem;
      cursor: pointer;
    }

    .btn-danger {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      border: none;
      background: #dc2626;
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
  `],
})
export class ConfirmDialogComponent implements OnChanges, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  private bg: PolygonBackground | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']) {
      if (this.open) {
        setTimeout(() => {
          if (this.containerRef && !this.bg) {
            this.bg = new PolygonBackground(this.containerRef.nativeElement, {
              theme: 'sunset',
              pointCount: 25,
              speed: 0.3,
            });
          }
        }, 0);
      } else {
        this.bg?.destroy();
        this.bg = null;
      }
    }
  }

  ngOnDestroy() {
    this.bg?.destroy();
  }
}
