import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material/material.module';
import { HomeComponent } from './home/home.component';
import { HttpClientModule } from '@angular/common/http';
import { GanttComponent, GanttJobDetailDialogComponent } from './gantt/gantt.component';
import { FormsModule } from '@angular/forms';

/** app.module */
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GanttComponent
  ],
  entryComponents: [
    GanttJobDetailDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
