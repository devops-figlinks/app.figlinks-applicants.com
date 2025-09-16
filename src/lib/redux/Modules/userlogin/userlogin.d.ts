declare namespace IReduxUserLogin {
  export interface ICreateUserPayload {
    name: string;
  }

  export interface UserDetails {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  }

  export interface IInitialLoginState {
    user: Partial<UserDetails>;
    emailWhilePasswordReset: string;
    refId: string;
  }

  export interface IUserResponse {
    _id: string;
    avatar: string;
    status: string;
    user_type: string;
    password_expired_at: string;
    email_verified: boolean;
    phone_verified: boolean;
    email: string;
    name: string;
    gender: string;
    access_token: string;
    refresh_token: string;
    message: string;
    phone: string;
  }

  export interface IUserErrorResponse {
    success: boolean;
    message: string;
    status_code?: string;
  }

  export interface ICreateUserPayload {
    id: number;
    email: string;
    password: string;
  }
  export interface IUser {
    _id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
    password: string;
  }
}

export { IReduxUserLogin };
