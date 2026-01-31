import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { HomeComponent } from './app/pages/home.component';
import { InteractiveComponent } from './app/pages/interactive.component';
import { ThemesComponent } from './app/pages/themes.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      { path: '', component: HomeComponent },
      { path: 'interactive', component: InteractiveComponent },
      { path: 'themes', component: ThemesComponent },
    ]),
  ],
}).catch((err) => console.error(err));
