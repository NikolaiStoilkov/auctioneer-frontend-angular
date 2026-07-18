import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { User } from '../../core/domain/user.model';

import { USERS_API } from '../../core/config/users.api';

/**
 * HTTP client for the users REST API.
 *
 * Fetches user profiles and submits profile updates.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private api = USERS_API;

  constructor (private http: HttpClient) {
  }

  /**
   * Fetches a user profile by id.
   *
   * @param id Id of the user to fetch.
   * @returns Observable emitting the requested {@link User}.
   */
  getById (id: number) {
    return this.http.get<User>(this.api.byId(id));
  }

  /**
   * Partially updates the given user's profile.
   *
   * @param user User payload with the updated fields.
   * @returns Observable completing when the profile has been updated.
   */
  edit (user: User) {
    return this.http.patch<void>(this.api.edit, user);
  }
}
