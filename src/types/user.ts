// User, BankDetails types

export interface User {
  _id?: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  role?: 'user' | 'admin';
}

export interface BankDetails {
  _id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
}
