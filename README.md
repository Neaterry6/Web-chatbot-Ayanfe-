# AYANFE AI - Advanced Multimedia Chatbot

A sophisticated AI-powered multimedia chatbot that offers advanced multi-domain service integration with a focus on user experience and robust system design.

## Key Features

- **Spotify-Style Music Player**: Full-featured music playback with synchronized lyrics display
- **Multi-Modal Chat Interface**: Intelligent responses across various domains
- **Advanced User Authentication**: Secure account management and personalization
- **API Integration**: Connections to various external services
- **Deployment Options**: Configuration for both Vercel and Render

## Music Player Features

- Dark theme interface matching Spotify's aesthetic
- Custom emoji playback controls
- Auto-scrolling lyrics that sync with music playback
- Fullscreen lyrics overlay with minimal player controls
- Variable playback speed control
- Download capabilities with fallback mechanisms

## Technologies

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Express.js server handling API routes and data persistence
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: React Query for optimized data fetching
- **Deployment**: Configurations for Vercel and Render

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Set up environment variables following `.env.example`
4. Start the development server with `npm run dev`

## Deployment

The application includes configuration files for both Vercel and Render platforms:

### Vercel Deployment
- Use the included `vercel.json` configuration
- The server implementation is handled by `server-vercel.js`

### Render Deployment
- Use the included `render.yaml` configuration
- Build process defined in `render-build.sh`
- Server implementation in `render-server.js`
