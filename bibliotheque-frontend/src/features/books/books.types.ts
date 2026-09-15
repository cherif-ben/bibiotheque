export interface Book {
  bookId: number;
  bookName: string;
  bookAuthor: string;
  bookGenre: string;
  noOfCopies: number;
}

export type CreateBookPayload = Omit<Book, 'bookId'>;
