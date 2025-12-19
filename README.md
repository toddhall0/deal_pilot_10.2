# Deal Pilot

A comprehensive transaction management and due diligence platform for commercial real estate acquisitions and dispositions.

## Features

- **AI-Powered Contract Analysis** - Automated contract review and data extraction using Claude AI
- **Deal Management** - Track commercial real estate transactions from start to close
- **Due Diligence Checklists** - Hierarchical deadline and milestone tracking
- **Task Management** - Full-featured task system with customizable views
- **Multi-Level Dashboards** - Deal, Client, and Firm-level insights
- **Document Management** - Upload, categorize, and manage transaction documents
- **Financial Tracking** - Monitor deal values, fees, and financial projections
- **Custom Reporting** - Generate comprehensive transaction reports
- **Notification System** - Configurable alerts for deadlines and assignments

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Authentication**: NextAuth.js (Auth.js)
- **State Management**: Zustand + TanStack Query
- **AI Integration**: Anthropic Claude API
- **File Storage**: AWS S3 / Cloudflare R2

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (Railway recommended)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/deal-pilot.git
   cd deal-pilot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your actual values.

4. Generate Prisma client:

   ```bash
   npm run db:generate
   ```

5. Push the database schema (development):

   ```bash
   npm run db:push
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable               | Description                                 |
| ---------------------- | ------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string                |
| `NEXTAUTH_SECRET`      | Secret for NextAuth.js session encryption   |
| `NEXTAUTH_URL`         | Base URL of your application                |
| `ANTHROPIC_API_KEY`    | API key for Claude AI integration           |
| `S3_ACCESS_KEY_ID`     | AWS/R2 access key for file storage          |
| `S3_SECRET_ACCESS_KEY` | AWS/R2 secret key for file storage          |
| `S3_BUCKET_NAME`       | S3 bucket name for documents                |
| `S3_REGION`            | S3 bucket region                            |
| `S3_ENDPOINT`          | S3 endpoint (for R2 or compatible services) |
| `RESEND_API_KEY`       | API key for email notifications             |
| `NEXT_PUBLIC_APP_URL`  | Public-facing URL of the application        |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/       # Main application pages
│   │   ├── deals/
│   │   ├── clients/
│   │   ├── tasks/
│   │   ├── reports/
│   │   └── settings/
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── shared/            # Shared components
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # Auth configuration
│   ├── utils.ts           # Utility functions
│   └── validations/       # Zod schemas
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── types/                 # TypeScript types
└── styles/                # Global styles
```

## Scripts

| Command               | Description               |
| --------------------- | ------------------------- |
| `npm run dev`         | Start development server  |
| `npm run build`       | Build for production      |
| `npm run start`       | Start production server   |
| `npm run lint`        | Run ESLint                |
| `npm run format`      | Format code with Prettier |
| `npm run db:generate` | Generate Prisma client    |
| `npm run db:push`     | Push schema to database   |
| `npm run db:migrate`  | Run database migrations   |
| `npm run db:studio`   | Open Prisma Studio        |

## Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Add a PostgreSQL database
3. Configure environment variables in Railway dashboard
4. Deploy automatically on push to main branch

### Environment Setup

For production, ensure all environment variables are properly configured:

- Use a strong `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- Set `NEXTAUTH_URL` to your production URL
- Configure S3/R2 credentials for document storage
- Add your Anthropic API key for AI features

## License

MIT License - see LICENSE file for details.
