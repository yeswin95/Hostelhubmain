## Stack

- Node.js + Express
- MongoDB Atlas + Mongoose
- JWT auth + bcrypt password hashing
- express-validator input validation
- Helmet, CORS, rate-limiting
- Transaction-safe room allocation

## Setup (MongoDB Atlas Only)

1. Create a MongoDB Atlas cluster and database user.
2. Allow your server IP in Atlas Network Access.
3. Copy connection string and create `backend/.env` from `backend/.env.example`.
4. Install and run:

```bash
cd backend
npm install
npm run dev
```

## Folder Structure

- `src/models`
- `src/controllers`
- `src/routes`
- `src/middlewares`
- `src/config`
- `src/utils`

## API Docs

Postman-ready examples are documented in `backend/POSTMAN_EXAMPLES.md`.
