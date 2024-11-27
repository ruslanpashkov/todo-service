# Fastify Todo API

A one-file todo API with Fastify and PostgreSQL. Has basic stuff like rate limiting, CORS, and handles shutdowns properly. Nothing fancy - it just works.

> P.S. Yes, it's all in one file. No, we're not sorry.

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /todos` - Retrieve all todos
- `POST /todos` - Create a new todo
- `PUT /todos/:id` - Update an existing todo
- `DELETE /todos/:id` - Delete a todo

## Prerequisites

- Node.js (v20 or higher)
- PostgreSQL database
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development
PORT=3000
PGUSER=your_db_user
PGHOST=your_db_host
PGDATABASE=your_db_name
PGPASSWORD=your_db_password
PGPORT=5432
CLIENT_URL=http://localhost:3000
```

## Installation

```bash
# Install dependencies
npm install

# Start the server
npm start
```

## Database Schema

Ensure your PostgreSQL database has the following table:

```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE
);
```

## Production Considerations

- Rate limiting is automatically enabled in production
- SSL is enforced for database connections
- CORS is restricted to the specified CLIENT_URL
- Logging is set to 'info' level with minimal request details

## License

[MIT License](LICENSE)
