import {
  Component,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { PolygonBackground, PolygonBackgroundOptions } from 'polygon-background';

@Component({
  selector: 'polygon-container',
  standalone: true,
  template: `
    <div #container class="polygon-container">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: inherit;
        justify-content: inherit;
      }

      .polygon-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: inherit;
        display: flex;
        align-items: inherit;
        justify-content: inherit;
      }
    `,
  ],
})
export class PolygonContainerComponent
  implements OnInit, AfterViewInit, OnDestroy, OnChanges
{
  @Input() theme: string = 'midnight';
  @Input() options: Partial<PolygonBackgroundOptions> = {};

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  instance: PolygonBackground | null = null;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.instance = new PolygonBackground(this.containerRef.nativeElement, {
      theme: this.theme,
      ...this.options,
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['theme'] && !changes['theme'].firstChange && this.instance) {
      this.instance.setTheme(this.theme);
    }
  }

  ngOnDestroy(): void {
    this.instance?.destroy();
    this.instance = null;
  }
}
