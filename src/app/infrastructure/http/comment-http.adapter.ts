import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommentPort } from '@/core/ports/comment.port';
import { Comment } from '@/core/domain/comment.model';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class CommentHttpAdapter extends CommentPort {
  private base = `${environment.apiUrl}/api/comments`;

  constructor(private http: HttpClient) {
    super();
  }

  getByAdId(adId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/${adId}`);
  }

  create(adId: number, comment: Comment): Observable<void> {
    return this.http.post<void>(`${this.base}/create/${adId}`, comment);
  }

  edit(comment: Comment): Observable<void> {
    return this.http.put<void>(`${this.base}/edit`, comment);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${id}`);
  }
}
