process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');

// ==================================================

describe('Test route /books.', () => {
  const baseUrl = '/books';

  const book1 = Object.freeze({
    isbn: '0691161518',
    amazon_url: 'http://a.co/eobPtX2',
    author: 'Matthew Lane',
    language: 'english',
    pages: 264,
    publisher: 'Princeton University Press',
    title: 'Power-Up: Unlocking the Hidden Mathematics in Video Games',
    year: 2017,
  });

  beforeEach(async () => {
    await db.query('TRUNCATE TABLE books');
  });

  afterAll(async () => {
    await db.end();
  });

  describe('GET /', () => {
    const url = baseUrl;

    beforeEach(async () => {
      await db.query(
        `INSERT INTO books (
          isbn,
          amazon_url,
          author,
          language,
          pages,
          publisher,
          title,
          year
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        Object.values(book1)
      );
    });

    test('Gets all books.', async () => {
      // Act
      const resp = await request(app).get(url);

      // Assert
      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({ books: [book1] });
    });
  });

  describe('GET /[id]', () => {
    const url = baseUrl + `/${book1.isbn}`;

    beforeEach(async () => {
      await db.query(
        `INSERT INTO books (
          isbn,
          amazon_url,
          author,
          language,
          pages,
          publisher,
          title,
          year
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        Object.values(book1)
      );
    });

    test('Gets a single book.', async () => {
      // Act
      const resp = await request(app).get(url);

      // Assert
      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({ book: book1 });
    });

    test('Returns 404 if book is not found.', async () => {
      // Arrange
      const url = '/books/99';

      // Act
      const resp = await request(app).get(url);

      // Assert
      expect(resp.statusCode).toBe(404);
    });
  });

  describe('POST /', () => {
    const url = baseUrl;

    test('Creates a new book.', async () => {
      // Act
      const resp = await request(app).post(url).send(book1);

      // Assert
      expect(resp.statusCode).toBe(201);
      expect(resp.body).toEqual({ book: book1 });

      const booksResults = await db.query('SELECT * FROM books');
      expect(booksResults.rowCount).toBe(1);
      expect(booksResults.rows[0]).toEqual(book1);
    });

    test('Returns 400 if body data does not follow schema.', async () => {
      // Arrange
      const newBook = { ...book1 };
      delete newBook.isbn;

      // Act
      const resp = await request(app).post(url).send(newBook);

      // Assert
      expect(resp.statusCode).toBe(400);

      const booksResults = await db.query('SELECT * FROM books');
      expect(booksResults.rowCount).toBe(0);
    });
  });

  describe('PUT /[isbn]', () => {
    const url = baseUrl + `/${book1.isbn}`;

    beforeEach(async () => {
      await db.query(
        `INSERT INTO books (
          isbn,
          amazon_url,
          author,
          language,
          pages,
          publisher,
          title,
          year
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        Object.values(book1)
      );
    });

    test('Updates existing book.', async () => {
      const updatedBook = { ...book1, year: 2024 };
      const updatedData = { ...updatedBook };
      delete updatedData.isbn;

      // Act
      const resp = await request(app).put(url).send(updatedData);

      // Assert
      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({ book: updatedBook });

      const booksResults = await db.query('SELECT * FROM books');
      expect(booksResults.rowCount).toBe(1);
      expect(booksResults.rows[0]).toEqual(updatedBook);
    });

    test('Returns 404 if book is not found.', async () => {
      // Arrange
      const url = '/books/99';

      const updatedData = { ...book1, year: 2024 };
      delete updatedData.isbn;

      // Act
      const resp = await request(app).put(url).send(updatedData);

      // Assert
      expect(resp.statusCode).toBe(404);

      const booksResults = await db.query('SELECT * FROM books');
      expect(booksResults.rowCount).toBe(1);
      expect(booksResults.rows[0]).toEqual(book1);
    });

    test('Returns 400 if body data does not follow schema.', async () => {
      // Arrange
      const updatedData = { ...book1, year: 3000 };
      delete updatedData.isbn;

      // Act
      const resp = await request(app).put(url).send(updatedData);

      // Assert
      expect(resp.statusCode).toBe(400);

      const booksResults = await db.query('SELECT * FROM books');
      expect(booksResults.rowCount).toBe(1);
      expect(booksResults.rows[0]).toEqual(book1);
    });
  });

  describe('DELETE /[isbn]', () => {
    const url = baseUrl + `/${book1.isbn}`;

    beforeEach(async () => {
      await db.query(
        `INSERT INTO books (
          isbn,
          amazon_url,
          author,
          language,
          pages,
          publisher,
          title,
          year
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        Object.values(book1)
      );
    });

    test('Deletes a book.', async () => {
      // Act
      const resp = await request(app).delete(url);

      // Assert
      expect(resp.statusCode).toBe(200);

      const booksResults = await db.query('SELECT * FROM books');
      expect(booksResults.rowCount).toBe(0);
    });

    test('Returns 404 if book is not found.', async () => {
      // Arrange
      const url = '/books/99';

      // Act
      const resp = await request(app).delete(url);

      // Assert
      expect(resp.statusCode).toBe(404);

      const booksResults = await db.query('SELECT * FROM books');
      expect(booksResults.rowCount).toBe(1);
      expect(booksResults.rows[0]).toEqual(book1);
    });
  });
});
