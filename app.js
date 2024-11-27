'use strict';

require('dotenv').config();

const fastify = require('fastify')({
  logger: process.env.NODE_ENV === 'production' ? {
    level: 'info',
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          hostname: request.hostname,
        };
      }
    }
  } : true
});

const { Pool } = require('pg');

const port = process.env.PORT || 3000;
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

fastify.register(require('@fastify/cors'), {
  origin: process.env.CLIENT_URL || false,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
});

if (process.env.NODE_ENV === 'production') {
  fastify.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute'
  });
}

fastify.get('/health', async () => {
  return { status: 'ok' };
});

fastify.get('/todos', async (request, reply) => {
  try {
    const { rows } = await pool.query('SELECT * FROM todos ORDER BY id DESC');
    return rows;
  } catch (err) {
    fastify.log.error(err);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

fastify.post('/todos', async (request, reply) => {
  const { title, completed = false } = request.body;

  if (!title || title.trim().length === 0) {
    reply.status(400).send({ error: 'Title is required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO todos (title, completed) VALUES ($1, $2) RETURNING *',
      [title.trim(), completed]
    );
    return rows[0];
  } catch (err) {
    fastify.log.error(err);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

fastify.put('/todos/:id', async (request, reply) => {
  const { id } = request.params;
  const { title, completed } = request.body;

  if (!title || title.trim().length === 0) {
    reply.status(400).send({ error: 'Title is required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'UPDATE todos SET title=$1, completed=$2 WHERE id=$3 RETURNING *',
      [title.trim(), completed, id]
    );

    if (rows.length === 0) {
      reply.status(404).send({ error: 'Todo not found' });
      return;
    }

    return rows[0];
  } catch (err) {
    fastify.log.error(err);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

fastify.delete('/todos/:id', async (request, reply) => {
  const { id } = request.params;
  try {
    const { rows } = await pool.query(
      'DELETE FROM todos WHERE id=$1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      reply.status(404).send({ error: 'Todo not found' });
      return;
    }

    return rows[0];
  } catch (err) {
    fastify.log.error(err);
    reply.status(500).send({ error: 'Internal server error' });
  }
});

const closeGracefully = async (signal) => {
  console.log(`Received signal to terminate: ${signal}`);

  await fastify.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', closeGracefully);
process.on('SIGTERM', closeGracefully);

const start = async () => {
  try {
    await fastify.listen({ host, port });
    console.log(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
