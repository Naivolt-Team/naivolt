// Transaction type

export type TransactionStatus = 'pending' | 'processing' | 'paid' | 'rejected';

export interface Transaction {
  _id: string;
  coin?: string;
  network?: string;
  amountCrypto?: number;
  amountNaira?: number;
  rateAtTime?: number;
  status: TransactionStatus;
  createdAt: string;
  transactionHash?: string;
  /** Legacy field – prefer coin */
  cryptoType?: string;
}
