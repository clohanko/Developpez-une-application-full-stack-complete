import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from 'src/app/services/auth.service';
import { PostService, PostDto } from 'src/app/services/post.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  isLogged = false;

  items: PostDto[] = [];
  sort: 'asc' | 'desc' = 'desc';
  page = 0;
  size = 10;
  total = 0;

  loading = false;
  errorMsg = '';

  // UI menu mobile
  menuOpen = false;

  constructor(
    private auth: AuthService,
    private posts: PostService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.auth.getLoginStatus().subscribe(ok => {
      this.isLogged = ok;
      if (ok) this.load(0);
      else this.reset();
    });
  }

  // ----- Landing (CTA) -----
  start(): void {
    this.router.navigate(['/login']);
  }

  // ----- Feed -----
  private reset(): void {
    this.items = [];
    this.page = 0;
    this.total = 0;
    this.errorMsg = '';
  }

  load(p: number = this.page): void {
    this.loading = true;
    this.errorMsg = '';
    this.posts.getFeed(this.sort, p, this.size).subscribe({
      next: (res) => {
        this.items = res.items;
        this.page = res.page;
        this.size = res.size;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Impossible de charger le fil.';
        this.loading = false;
      },
    });
  }

  switchSort(): void {
    this.sort = this.sort === 'desc' ? 'asc' : 'desc';
    this.load(0);
  }

  prev(): void { if (this.hasPrev) this.load(this.page - 1); }
  next(): void { if (this.hasNext) this.load(this.page + 1); }

  get hasPrev(): boolean { return this.page > 0; }
  get hasNext(): boolean { return this.page < this.maxPages - 1; }
  get maxPages(): number { return Math.max(1, Math.ceil(this.total / this.size)); }

  // ----- Menu mobile -----
  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }

  @HostListener('window:scroll')
  onScroll() { /* permet de fermer si tu veux, sinon ignore */ }

  logout(): void {
    this.auth.logout(); // déclenche aussi loggedIn false dans ton service
    this.closeMenu();
    this.router.navigate(['/']);
  }
}
