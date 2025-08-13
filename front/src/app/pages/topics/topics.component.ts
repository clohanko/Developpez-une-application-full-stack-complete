import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Topic, TopicService } from 'src/app/services/topic.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-topics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topics.component.html',
  styleUrls: ['./topics.component.scss'],
})
export class TopicsComponent implements OnInit {
  topics: Topic[] = [];
  isLogged = false;

  /** IDs des topics suivis */
  subscribed = new Set<number>();

  /** IDs en cours de requête (subscribe/unsubscribe) pour désactiver les boutons */
  loadingIds = new Set<number>();

  constructor(
    private topicService: TopicService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // 1) Charger tous les topics (public)
    this.topicService.list().subscribe({
      next: (t) => (this.topics = t),
      error: () => (this.topics = []),
    });

    // 2) Charger MES abonnements quand connecté
    this.auth.getLoginStatus().subscribe((ok) => {
      this.isLogged = ok;
      this.subscribed.clear();

      if (ok) {
        // GET /api/subscriptions -> number[]
        this.topicService.mySubscriptions().subscribe({
          next: (ids: number[]) => {
            this.subscribed = new Set(ids.map(Number));
          },
          error: () => {
            this.subscribed.clear();
          },
        });
      }
    });
  }

  isSubscribed(topicId: number): boolean {
    return this.subscribed.has(topicId);
  }

  onSubscribe(topicId: number): void {
    if (!this.isLogged || this.loadingIds.has(topicId)) return;
    this.loadingIds.add(topicId);

    this.topicService.subscribe(topicId).subscribe({
      next: () => {
        this.subscribed.add(topicId);
        this.loadingIds.delete(topicId);
      },
      error: () => {
        this.loadingIds.delete(topicId);
      },
    });
  }

  // Gardé pour usage éventuel ailleurs
  onUnsubscribe(topicId: number): void {
    if (!this.isLogged || this.loadingIds.has(topicId)) return;
    this.loadingIds.add(topicId);

    this.topicService.unsubscribe(topicId).subscribe({
      next: () => {
        this.subscribed.delete(topicId);
        this.loadingIds.delete(topicId);
      },
      error: () => {
        this.loadingIds.delete(topicId);
      },
    });
  }

  trackById(_: number, t: Topic) { return t.id; }
}
