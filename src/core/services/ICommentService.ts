import { Observable } from 'rxjs';
import { Comment } from '../domain/comment.model';

export abstract class ICommentService {
  abstract getByAdId(adId: number): Observable<Comment[]>;
  abstract create(comment: Comment): Observable<void>;
  abstract edit(comment: Comment): Observable<void>;
  abstract delete(id: number): Observable<void>;
}
