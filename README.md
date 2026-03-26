# Pholothenpric Golf Lottery

A golf-themed lottery application built with React, Node.js, Express, and MongoDB.

## Features

- User authentication and authorization
- Golf lottery with score selection (1-45)
- Charity integration
- Stripe payment integration for subscriptions
- Admin panel for lottery management

## Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Stripe account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Backend
cd backend
npm install

# Frontend
cd ..
npm install
```

### Environment Variables

#### Backend (.env)
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

#### Frontend (.env)
```env
# Razorpay checkout is loaded from CDN in the front-end, so no publishable key is required there.
```

### Razorpay Setup

1. Create a Razorpay account at [razorpay.com](https://razorpay.com)
2. Go to Dashboard > Settings > API Keys
3. Create a new key pair (test mode) and copy Key ID + Key Secret
4. Replace the placeholder values in your backend .env file

### Running the Application

1. Start the backend:
```bash
cd backend
npm start
```

2. Start the frontend:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Usage

1. Register/Login to create an account
2. Subscribe to a plan using Stripe payment
3. Select 5 golf scores (1-45) to enter the lottery
4. View results and charity impact

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Subscriptions
- `POST /api/subscription/create` - Create subscription
- `GET /api/subscription/status` - Get subscription status

### Scores
- `POST /api/scores/add` - Add golf scores
- `GET /api/scores` - Get user scores

### Charities
- `GET /api/charities` - Get all charities

## Technologies Used

- **Frontend**: React 19, Vite, Tailwind CSS, Stripe Elements
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT
- **Payments**: Stripe

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
