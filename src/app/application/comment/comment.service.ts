import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommentPort } from '@/core/ports/comment.port';
import { Comment } from '@/core/domain/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  constructor(private commentPort: CommentPort) {}

  getByAdId(adId: number): Observable<Comment[]> {
    return this.commentPort.getByAdId(adId);
  }

  create(adId: number, comment: Comment): Observable<void> {
    return this.commentPort.create(adId, comment);
  }

  edit(comment: Comment): Observable<void> {
    return this.commentPort.edit(comment);
  }

  delete(id: number): Observable<void> {
    return this.commentPort.delete(id);
  }
}
