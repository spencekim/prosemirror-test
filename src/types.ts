import { Transaction } from 'prosemirror-state';

export interface TransactionEvent {
    type: string;
    transaction: Transaction;
}
