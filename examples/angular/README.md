# Angular Example

## Setup

```bash
# From the repository root
npm link

# Install and run
cd examples/angular
npm install
npm link polygon-background
npm run dev
```

Open http://localhost:3002

## Pages

- **Home** - Theme switching demo
- **Interactive** - Mouse physics (push/pull/swirl modes)
- **Themes** - All themes displayed in a grid

## Usage

```typescript
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { PolygonBackground } from 'polygon-background';

@Component({
  selector: 'app-background',
  standalone: true,
  template: `<div #container style="width: 100%; height: 100vh"></div>`,
})
export class BackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;
  private bg: PolygonBackground | null = null;

  ngAfterViewInit() {
    this.bg = new PolygonBackground(this.containerRef.nativeElement, {
      theme: 'midnight',
      pointCount: 80,
    });
  }

  ngOnDestroy() {
    this.bg?.destroy();
  }
}
```

## Changing Theme

```typescript
setTheme(theme: string) {
  this.bg?.setTheme(theme);
}
```

## Mouse Interaction

```typescript
this.bg = new PolygonBackground(container, {
  theme: 'ocean',
  mouse: {
    enabled: true,
    mode: 'push',      // 'push' | 'pull' | 'swirl'
    strength: 80,
  },
  interaction: {
    clickShockwave: true,
    holdGravityWell: true,
  },
});
```
