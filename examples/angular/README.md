# Polygon Background - Angular Example

An Angular 18 + TypeScript demo showcasing the polygon-background library.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

1. Link the library (from polygon-background root):

   ```bash
   cd /path/to/polygon-background
   npm link
   ```

2. Install dependencies:

   ```bash
   cd examples/angular
   npm install
   npm link polygon-background
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3002

## Examples Demonstrated

1. **Full Page Background** - Hero section with overlay content
2. **Card Backgrounds** - Multiple themed cards (ocean, sunset, matrix)
3. **Interactive Section** - Mouse-driven height deformation
4. **Theme Switcher** - Runtime theme transitions with smooth animations
5. **Custom Controls** - Dynamic option updates via sliders

## Project Structure

```
examples/angular/
├── src/
│   ├── main.ts                     # Angular bootstrap
│   ├── index.html                  # Entry HTML
│   ├── styles.css                  # Global styles
│   └── app/
│       ├── app.component.ts        # Root component
│       └── components/
│           ├── app-bar/
│           │   └── app-bar.component.ts
│           ├── polygon-container/
│           │   └── polygon-container.component.ts
│           ├── hero-section/
│           │   └── hero-section.component.ts
│           ├── card-grid/
│           │   └── card-grid.component.ts
│           ├── interactive-section/
│           │   └── interactive-section.component.ts
│           ├── theme-switcher/
│           │   └── theme-switcher.component.ts
│           └── control-panel/
│               └── control-panel.component.ts
├── angular.json
├── package.json
└── tsconfig.json
```

## Key Implementation Notes

### PolygonContainerComponent

The `PolygonContainerComponent` wraps the polygon-background library for Angular:

```typescript
import { PolygonContainerComponent } from './components/polygon-container/polygon-container.component';

@Component({
  imports: [PolygonContainerComponent],
  template: `
    <!-- Basic usage -->
    <polygon-container theme="midnight" [options]="{ pointCount: 100 }">
      <your-content />
    </polygon-container>

    <!-- With ViewChild for imperative access -->
    <polygon-container #container theme="ocean" />
  `,
})
export class MyComponent {
  @ViewChild('container') container!: PolygonContainerComponent;

  someMethod() {
    this.container.instance?.setTheme('sunset');
  }
}
```

### Theme Transitions

Theme changes automatically animate when `transition.enabled` is true:

```html
<polygon-container
  [theme]="activeTheme"
  [options]="{
    transition: { enabled: true, duration: 800 }
  }"
/>
```

### Mouse Interaction

Enable mouse-based height deformation:

```typescript
interactiveOptions: Partial<PolygonBackgroundOptions> = {
  mouse: {
    enabled: true,
    radius: 150,
    heightInfluence: 0.8,
  },
  height: {
    mode: 'mouse',
  },
};
```

### Two-way Binding with Controls

Use Angular's FormsModule for real-time updates:

```typescript
@Component({
  imports: [FormsModule, PolygonContainerComponent],
  template: `
    <input
      type="range"
      [(ngModel)]="pointCount"
      (ngModelChange)="updatePointCount($event)"
    />
  `,
})
export class ControlComponent {
  @ViewChild('container') container!: PolygonContainerComponent;
  pointCount = 80;

  updatePointCount(value: number) {
    this.container.instance?.setOption('pointCount', value);
  }
}
```

## Standalone Components

This example uses Angular's standalone components (no NgModule):

```typescript
@Component({
  standalone: true,
  imports: [PolygonContainerComponent],
  // ...
})
export class MyComponent {}
```

## Component Styles

Styles are scoped using Angular's ViewEncapsulation (default emulated):

```typescript
@Component({
  styles: [`
    .container {
      /* scoped to this component */
    }
  `],
})
```

## TypeScript

Full TypeScript support with types from polygon-background:

```typescript
import { PolygonBackgroundOptions } from 'polygon-background';

options: Partial<PolygonBackgroundOptions> = {
  pointCount: 100,
  speed: 0.8,
};
```
