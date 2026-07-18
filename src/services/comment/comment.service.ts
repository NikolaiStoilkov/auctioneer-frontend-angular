import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import * as variables from '@env/environment.development';

import { Comment } from '../../core/domain/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private base = `${variables.environment.API_URL}/api/comments`;

  constructor(private http: HttpClient) {}

  getByAdId(adId: number) {
    return this.http.get<Comment[]>(`${this.base}/${adId}`);
  }

  create(adId: number, comment: Comment) {
    return this.http.post(`${this.base}/create/${adId}`, comment);
  }

  edit(comment: Comment) {
    return this.http.put(`${this.base}/edit`, comment);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/delete/${id}`);
  }
}
