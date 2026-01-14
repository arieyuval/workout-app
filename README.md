# Workout Tracker App

A Next.js application for tracking your workout progress. Focus on logging sets and monitoring weight progression across different exercises, organized by muscle groups.

## Features

- Exercise organization by muscle groups (Chest, Back, Legs, Shoulders, Arms, Core)
- Universal search for exercises
- Track weight, reps, date, and notes for each set
- View personal records for different rep ranges (1RM, 3RM, 5RM, etc.)
- Progress charts showing weight progression over time
- Full set history with sortable tables
- Responsive design with dark mode support

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Deployment:** Vercel

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to the SQL Editor and run the setup script from [supabase-setup.sql](supabase-setup.sql)
4. Get your project URL and anon key from Project Settings > API

### 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Database Schema

### Tables

**exercises**
- `id` (UUID, primary key)
- `name` (text)
- `muscle_group` (text)
- `default_pr_reps` (integer, default: 1)
- `created_at` (timestamp)

**sets**
- `id` (UUID, primary key)
- `exercise_id` (UUID, foreign key to exercises)
- `weight` (decimal)
- `reps` (integer)
- `date` (timestamp)
- `notes` (text, optional)
- `created_at` (timestamp)

## Project Structure

```
workout-app/
├── app/
│   ├── api/              # API routes
│   │   ├── exercises/    # Exercise endpoints
│   │   └── sets/         # Set logging endpoints
│   ├── components/       # React components
│   │   ├── SearchBar.tsx
│   │   ├── MuscleTabs.tsx
│   │   ├── ExerciseCard.tsx
│   │   ├── ExerciseDetail.tsx
│   │   ├── SetLogForm.tsx
│   │   ├── HistoryTable.tsx
│   │   ├── PRList.tsx
│   │   └── ProgressChart.tsx
│   ├── exercise/[id]/    # Exercise detail page
│   ├── page.tsx          # Home page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── types.ts          # TypeScript types
│   └── data-utils.ts     # Data fetching utilities
└── public/               # Static assets
```

## Usage

1. **Browse Exercises**: Use the muscle group tabs to view exercises by category
2. **Search**: Use the search bar to find specific exercises
3. **View Details**: Click on an exercise card to see full details
4. **Log Sets**: Use the form on the exercise detail page to log new sets
5. **Track Progress**: View your PRs, progress chart, and full history on the detail page

## Deploy on Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the repository to [Vercel](https://vercel.com/new)
3. Add your environment variables in the Vercel project settings
4. Deploy

Vercel will automatically detect that it's a Next.js app and configure the deployment settings.

## Future Enhancements

- Custom exercise creation
- Edit/delete sets
- Export data (CSV, PDF)
- Exercise images/videos
- Body weight tracking
- Exercise templates/programs
- Advanced analytics

## License

MIT
