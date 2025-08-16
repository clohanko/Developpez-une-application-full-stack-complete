import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, Validators,
  FormGroup, FormControl
} from '@angular/forms';
import { Router } from '@angular/router';
import { TopicService, Topic } from 'src/app/services/topic.service';
import { PostService, CreatePostPayload } from 'src/app/services/post.service';

type NewPostForm = FormGroup<{
  topicId: FormControl<number | null>;
  title:   FormControl<string>;
  content: FormControl<string>;
}>;

@Component({
  selector: 'app-new-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-post.component.html',
  styleUrls: ['./new-post.component.scss'],
})
export class NewPostComponent implements OnInit {
  topics: Topic[] = [];
  loading = false;
  errorMsg = '';

  // ✅ Formulaire strictement typé
  form: NewPostForm = this.fb.group({
    topicId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    title:   this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]),
    content: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(1), Validators.maxLength(10000)]),
  });

  constructor(
    private fb: FormBuilder,
    private topicService: TopicService,
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.topicService.list().subscribe({
      next: (t) => (this.topics = t),
      error: () => (this.errorMsg = 'Impossible de charger les thèmes'),
    });
  }

  goBack(): void {
    if (history.length > 1) history.back();
    else this.router.navigate(['/']);
  }

  submit(): void {
    this.errorMsg = '';
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;

    const { topicId, title, content } = this.form.getRawValue();

    if (topicId == null) {
      this.errorMsg = 'Choisis un thème.';
      this.loading = false;
      return;
    }

    const payload: CreatePostPayload = { topicId, title, content };

    this.postService.create(payload).subscribe({
      next: (post) => this.router.navigate(['/posts', post.id]),
      error: () => {
        this.errorMsg = 'Échec de création.';
        this.loading = false;
      },
    });
  }
}
