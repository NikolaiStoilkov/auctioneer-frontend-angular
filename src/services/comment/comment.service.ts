import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Comment } from '../../core/domain/comment.model';
import { COMMENTS_API } from '../../core/config/comments.api';

/**
 * HTTP client for the ad comments REST API.
 *
 * Supports listing the comments of an ad and creating, editing,
 * and deleting individual comments.
 */
@Injectable({ providedIn: 'root' })
export class CommentService {
  private api = COMMENTS_API;

  constructor(private http: HttpClient) {}

  /**
   * Fetches all comments posted on the given ad.
   *
   * @param adId Id of the ad whose comments to fetch.
   * @returns Observable emitting the ad's comments.
   */
  getByAdId(adId: number) {
    return this.http.get<Comment[]>(this.api.byAdId(adId));
  }

  /**
   * Posts a new comment. The target ad id travels inside the payload.
   *
   * @param comment Comment payload to create (includes adId).
   * @returns Observable completing when the comment has been created.
   */
  create(comment: Comment) {
    return this.http.post(this.api.create, comment);
  }

  /**
   * Updates an existing comment.
   *
   * @param comment Comment payload including its id.
   * @returns Observable completing when the comment has been updated.
   */
  edit(comment: Comment) {
    return this.http.put(this.api.edit, comment);
  }

  /**
   * Deletes a comment.
   *
   * @param id Id of the comment to delete.
   * @returns Observable completing when the comment has been deleted.
   */
  delete(id: number) {
    return this.http.delete<void>(this.api.delete(id));
  }
}
