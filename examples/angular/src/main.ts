import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { HomeComponent } from './app/pages/home.component';
import { InteractiveComponent } from './app/pages/interactive.component';
import { ComponentsComponent } from './app/pages/components.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      { path: '', component: HomeComponent },
      { path: 'interactive', component: InteractiveComponent },
      { path: 'components', component: ComponentsComponent },
    ]),
  ],
}).catch((err) => console.error(err));
