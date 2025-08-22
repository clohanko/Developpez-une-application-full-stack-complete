import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PostService, PostDto } from 'src/app/services/post.service';
import { AuthService } from 'src/app/services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss'],
})
export class PostDetailComponent implements OnInit {
  post?: PostDto;
  loading = true;
  errorMsg = '';
  isLogged = false;

  commentForm = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(5000)]],
  });
  sending = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private postService: PostService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.auth.getLoginStatus()
      .pipe(catchError(() => of(false)))
      .subscribe(ok => (this.isLogged = ok));

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.postService.getOne(id).subscribe({
      next: (p) => { this.post = p; this.loading = false; },
      error: () => { this.errorMsg = 'Article introuvable.'; this.loading = false; }
    });
  }

  /** Appelé par (click)="goBack()" dans le template */
  goBack(): void {
    if (history.length > 1) history.back();
    else this.router.navigate(['/']);
  }

  /** Appelé par (ngSubmit)="addComment()" dans le template */
  addComment(): void {
    this.submitComment();
  }

  /** Implémentation réelle d’envoi du commentaire */
  private submitComment(): void {
    if (!this.isLogged || this.commentForm.invalid || !this.post || this.sending) {
      this.commentForm.markAllAsTouched(); return;
    }
    this.sending = true;
    const content = this.commentForm.value.content!.trim();
    this.postService.addComment(this.post.id, { content }).subscribe({
      next: (c) => {
        this.post!.comments = [...(this.post!.comments || []), c];
        this.commentForm.reset();
        this.sending = false;
      },
      error: () => { this.sending = false; }
    });
  }
}
