export interface User {
  id?: number;
  username: string;
  passwordHash?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  ucn: string;
  country: string;
  city: string;
  street: string;
  streetNumber: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  roles?: string[];
  balance?: number;
}

export interface SignInRequest {
  username: string;
  password: string;
}

export interface SignUpRequest {
  username: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  ucn: string;
  country: string;
  city: string;
  street: string;
  streetNumber: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  roles?: string[];
}
