# Workout Tracker - Setup Guide

## Quick Start

Your workout tracker app is ready to use! Follow these steps to get it running:

### 1. Set Up Supabase (Required)

Before you can use the app, you need to set up a Supabase database:

1. **Create a Supabase account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project (choose a name, password, and region)

2. **Run the database setup script**
   - Once your project is created, go to the **SQL Editor** in the left sidebar
   - Copy the contents of `supabase-setup.sql` from this project
   - Paste it into the SQL Editor and click "Run"
   - This will create the tables and insert placeholder exercises

3. **Get your API credentials**
   - Go to **Project Settings** > **API**
   - Copy your **Project URL** and **anon/public key**

### 2. Configure Environment Variables

1. **Create `.env.local` file**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Add your Supabase credentials**
   Open `.env.local` and replace the placeholder values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## What You'll See

### Main Page
- **Muscle group tabs**: Click to switch between Chest, Back, Legs, Shoulders, Arms, Core
- **Search bar**: Search for exercises by name or muscle group
- **Exercise cards**: Shows last set and current PR for each exercise
- **Placeholder exercises**: The database comes with 18 placeholder exercises (3 per muscle group)

### Exercise Detail Page
Click any exercise card to see:
- **Last set** (excluding today's workouts)
- **Personal Record selector** (choose different rep maxes: 1RM, 2RM, etc.)
- **Quick log form** to add a new set (weight, reps, optional notes)
- **Personal Records list** showing PRs for 1, 3, 5, 8, and 10 rep ranges
- **Progress chart** visualizing weight progression over time
- **Full history table** with all logged sets (sortable by date, weight, or reps)

## Using the App

### Log Your First Set
1. Click on any exercise card
2. Scroll to the "Log New Set" form
3. Enter the weight you lifted (in pounds)
4. Enter the number of reps
5. Optionally add notes (e.g., "felt strong", "improved form")
6. Click "Log Set"
7. The chart, PRs, and history will update automatically

### Track Your Progress
- **View PRs**: See your personal records for different rep ranges
- **Check the chart**: Visual representation of your weight progression
- **Review history**: Full table of all your logged sets with dates and notes
- **Change PR display**: Use the dropdown on the exercise page to see max weight for different rep counts

### Customize Exercises Later
The placeholder exercises can be renamed directly in Supabase:
1. Go to your Supabase project
2. Navigate to **Table Editor** > **exercises**
3. Click on an exercise name and edit it
4. The changes will appear immediately in your app

## Deploying to Vercel

1. **Push to Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Add your environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click "Deploy"

## Troubleshooting

### App shows "No exercises in this category"
- Make sure you ran the `supabase-setup.sql` script in your Supabase SQL Editor
- Check that your `.env.local` file has the correct Supabase credentials

### Can't log sets
- Verify your Supabase credentials are correct
- Check the browser console for errors (F12 > Console tab)
- Make sure the exercises table has data

### Chart not showing
- You need at least 2 logged sets for the chart to display
- Check that dates are being saved correctly in the database

## Next Steps

1. **Rename placeholder exercises** to real exercise names in Supabase
2. **Start logging your workouts** to track progress
3. **Explore the features**: Try different rep max selectors, sort the history table, etc.
4. **Add more exercises** (you can add them directly in Supabase for now)

## Future Enhancements

This is your MVP! Consider adding:
- Custom exercise creation UI
- Edit/delete sets functionality
- Exercise images
- Export data to CSV
- More detailed analytics
- Body weight tracking

---

**Need help?** Check the main README.md for more detailed information about the project structure and features.
