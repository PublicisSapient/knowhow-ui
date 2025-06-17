import { Component, Input } from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { HttpService } from 'src/app/services/http.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'],
})
export class FeedbackComponent {
  @Input() visibleSidebar: boolean;
  feedback = true;
  voiceForm = new UntypedFormGroup({
    feedback: new UntypedFormControl('', {
      validators: [Validators.required, Validators.maxLength(600)],
    }),
  });
  isFeedbackSubmitted = false;
  formMessage = '';

  constructor(private httpService: HttpService) {}

  toggleFlag() {
    this.feedback = !this.feedback;
  }

  save() {
    const postObj = this.voiceForm.value;
    this.httpService
      .submitFeedbackData(postObj)
      .pipe(
        tap((response) => {
          if (response.message) {
            this.isFeedbackSubmitted = true;
            this.formMessage = response.message;
            setTimeout(() => {
              this.formMessage = '';
            }, 3000);
            this.voiceForm.reset();
          }
        }),
        catchError((error) => {
          console.log(error);
          this.isFeedbackSubmitted = false;
          setTimeout(() => {
            this.formMessage = '';
          }, 3000);
          return of();
        }),
      )
      .subscribe();
  }

  open() {
    document.documentElement.scrollTop = 0;
  }

  OnOverlayHide() {
    this.voiceForm.reset();
  }
}
