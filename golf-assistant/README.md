# Golf Assistant Pro

An AI-powered app for golf club recommendations based on course conditions, player characteristics, and environmental factors.

## Project Structure

This is a monorepo project with the following structure:

```
golf-assistant/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express backend
├── packages/
│   ├── ui/                  # Shared UI components (to be implemented)
│   ├── config/              # Shared configuration (to be implemented)
│   └── types/               # Shared TypeScript types
```

## Prerequisites

- Node.js (>= 18.0.0)
- npm (>= 8.0.0)

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/danielennis11111/golf-assistant.git
   cd golf-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the shared packages:
   ```bash
   npm run build --filter=@golf-assistant/types
   ```

### Development

1. Start the development servers:
   ```bash
   npm run dev
   ```

   This will start both the frontend and backend in development mode.

### Environment Variables

#### Frontend (.env.local in apps/web)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Backend (.env in apps/api)
```
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
```

## Features

- Image upload for course analysis
- AI-powered club recommendations
- Adjustments based on player age
- Wind condition considerations
- Terrain analysis
- Obstacle detection
- Putting analysis

## Tech Stack

### Frontend
- Next.js 14
- React 19
- TypeScript
- Tailwind CSS
- Axios for API requests

### Backend
- Express.js
- TypeScript
- Multer for file uploads
- Winston for logging

## License

This project is licensed under the ISC License.

## Acknowledgments

- Original project idea and implementation by Daniel Ennis 