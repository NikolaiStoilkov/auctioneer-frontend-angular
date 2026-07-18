import { Observable } from 'rxjs';
import { Comment } from '../domain/comment.model';

export abstract class CommentPort {
  abstract getByAdId(adId: number): Observable<Comment[]>;
  abstract create(adId: number, comment: Comment): Observable<void>;
  abstract edit(comment: Comment): Observable<void>;
  abstract delete(id: number): Observable<void>;
}
