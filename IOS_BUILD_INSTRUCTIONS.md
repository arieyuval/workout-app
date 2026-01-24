# Plates iOS App - Build Instructions for AI Assistant

## Project Overview

Build a native iOS app called **"Plates - The Lifter's Database"** that replicates the functionality of the existing web application. The app must connect to the **same Supabase backend** to maintain data consistency across platforms.

**Priority 1**: Full functionality with existing Supabase tables
**Priority 2**: Consistent user experience with the web version (flows, design patterns, UX)

---

## 1. SUPABASE BACKEND (DO NOT MODIFY)

The iOS app will use the existing Supabase project. **Do not create new tables or modify existing schema.**

### Environment Configuration
```swift
// Store these securely (Keychain or xcconfig, never hardcode in repo)
let supabaseURL = "https://[PROJECT_ID].supabase.co"
let supabaseAnonKey = "[ANON_KEY]"
```

### Database Schema

#### Table: `exercises`
```sql
id: UUID (primary key)
name: TEXT (not null)
muscle_group: TEXT (not null) -- 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Biceps', 'Triceps', 'Core', 'Cardio'
exercise_type: TEXT (default 'strength') -- 'strength' or 'cardio'
default_pr_reps: INTEGER (default 1)
is_base: BOOLEAN (default false) -- Base exercises shown to all users
uses_body_weight: BOOLEAN (default false) -- For pull-ups, dips, etc.
pinned_note: TEXT (nullable)
created_at: TIMESTAMP
```

#### Table: `user_exercises` (Junction table linking users to their exercises)
```sql
id: UUID (primary key)
user_id: UUID (references auth.users)
exercise_id: UUID (references exercises)
created_at: TIMESTAMP
UNIQUE(user_id, exercise_id)
```

#### Table: `sets` (Workout logs)
```sql
id: UUID (primary key)
exercise_id: UUID (references exercises)
user_id: UUID (references auth.users)

-- Strength training fields
weight: DECIMAL (nullable) -- in lbs
reps: INTEGER (nullable)

-- Cardio fields
distance: DECIMAL (nullable) -- in miles
duration: INTEGER (nullable) -- in minutes

date: TIMESTAMP (when the set was performed)
notes: TEXT (nullable)
created_at: TIMESTAMP
```

**IMPORTANT**: A set must have EITHER (weight AND reps) OR (distance AND duration), never both or neither.

#### Table: `user_profiles`
```sql
id: UUID (primary key)
user_id: UUID (references auth.users, unique)
current_weight: DECIMAL (nullable) -- in lbs
goal_weight: DECIMAL (nullable) -- in lbs
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### Table: `body_weight_logs`
```sql
id: UUID (primary key)
user_id: UUID (references auth.users)
weight: DECIMAL (not null) -- in lbs
date: TIMESTAMP
notes: TEXT (nullable)
created_at: TIMESTAMP
```

### Base Exercises (Pre-seeded in Database)
These are `is_base: true` and automatically available to all users:

| Muscle Group | Exercises |
|-------------|-----------|
| Chest | Bench Press, Incline Dumbbell Press, Cable Flyes |
| Back | Deadlift, Barbell Row, Pull-ups |
| Legs | Squat, Romanian Deadlift, Leg Press |
| Shoulders | Overhead Press, Lateral Raises, Face Pulls |
| Arms | Barbell Curl, Tricep Pushdown, Hammer Curls |
| Core | Plank, Cable Crunches, Hanging Leg Raises |
| Cardio | Running, Cycling, Rowing |

---

## 2. DATA MODELS (Swift)

```swift
// MARK: - Enums

enum MuscleGroup: String, Codable, CaseIterable {
    case all = "All"
    case chest = "Chest"
    case back = "Back"
    case legs = "Legs"
    case shoulders = "Shoulders"
    case arms = "Arms"
    case biceps = "Biceps"
    case triceps = "Triceps"
    case core = "Core"
    case cardio = "Cardio"
}

enum ExerciseType: String, Codable {
    case strength = "strength"
    case cardio = "cardio"
}

// MARK: - Models

struct Exercise: Identifiable, Codable {
    let id: UUID
    var name: String
    var muscleGroup: MuscleGroup
    var exerciseType: ExerciseType
    var defaultPRReps: Int
    var isBase: Bool
    var usesBodyWeight: Bool
    var pinnedNote: String?
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, name
        case muscleGroup = "muscle_group"
        case exerciseType = "exercise_type"
        case defaultPRReps = "default_pr_reps"
        case isBase = "is_base"
        case usesBodyWeight = "uses_body_weight"
        case pinnedNote = "pinned_note"
        case createdAt = "created_at"
    }
}

struct WorkoutSet: Identifiable, Codable {
    let id: UUID
    var exerciseId: UUID
    var userId: UUID?

    // Strength fields
    var weight: Double?
    var reps: Int?

    // Cardio fields
    var distance: Double?
    var duration: Int?

    var date: Date
    var notes: String?
    var createdAt: Date?

    // Computed
    var isStrength: Bool { weight != nil && reps != nil }
    var isCardio: Bool { distance != nil && duration != nil }

    enum CodingKeys: String, CodingKey {
        case id
        case exerciseId = "exercise_id"
        case userId = "user_id"
        case weight, reps, distance, duration, date, notes
        case createdAt = "created_at"
    }
}

struct PersonalRecord {
    let reps: Int
    let weight: Double
    let date: Date
}

struct UserProfile: Identifiable, Codable {
    let id: UUID
    var userId: UUID
    var currentWeight: Double?
    var goalWeight: Double?
    var createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case currentWeight = "current_weight"
        case goalWeight = "goal_weight"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct BodyWeightLog: Identifiable, Codable {
    let id: UUID
    var userId: UUID
    var weight: Double
    var date: Date
    var notes: String?
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case weight, date, notes
        case createdAt = "created_at"
    }
}
```

---

## 3. AUTHENTICATION

Use the `supabase-swift` SDK for authentication.

### Required Flows

1. **Sign Up**
   - Email + Password
   - Collect user's name
   - Optional: Initial weight and goal weight
   - Store in user metadata during signup

2. **Sign In**
   - Email + Password
   - Handle "incorrect password" and "user not found" errors gracefully

3. **Sign Out**
   - Clear local session
   - Navigate to login screen

4. **Session Persistence**
   - Store auth tokens securely in Keychain
   - Auto-refresh expired tokens
   - Handle session expiration gracefully

5. **Profile Initialization**
   - On first login, check if `user_profiles` entry exists
   - If not, create one using metadata from signup (initial_weight, goal_weight)

### Authentication Code Pattern
```swift
// Sign up with metadata
try await supabase.auth.signUp(
    email: email,
    password: password,
    data: [
        "name": .string(name),
        "initial_weight": initialWeight.map { .double($0) } ?? .null,
        "goal_weight": goalWeight.map { .double($0) } ?? .null
    ]
)

// Sign in
try await supabase.auth.signIn(email: email, password: password)

// Get current user
let user = try await supabase.auth.session.user

// Sign out
try await supabase.auth.signOut()
```

---

## 4. APP SCREENS & USER FLOWS

### Navigation Structure
Use a **Tab Bar** with these tabs:
1. **Exercises** (Home) - Main exercise list
2. **History** - Workout history by date
3. **Weight** - Body weight tracking
4. **Profile/Settings** - User settings, logout

### Screen 1: Exercise List (Home)

**Layout:**
- Search bar at top
- Horizontal scrolling muscle group tabs: All, Chest, Back, Legs, Shoulders, Arms, Biceps, Triceps, Core, Cardio
- Scrollable list of exercise cards

**Exercise Card Contents:**
- Exercise name (tappable to go to detail)
- Muscle group label with color coding
- Pinned note indicator (if exists)
- Stats row:
  - **Last Session**: Top set from previous workout day (not today)
  - **Last Set**: Most recent set logged (including today)
  - **Current PR**: Highest weight for `default_pr_reps` or more reps
- Quick log form (inline):
  - Weight input (decimal)
  - "×" separator
  - Reps input (integer)
  - Submit button
- Success state: Show green checkmark with "Done" briefly after logging

**Add Exercise Button:**
- Floating action button or header button
- Opens modal to create custom exercise
- Fields: Name, Muscle Group (picker), Exercise Type (strength/cardio)

### Screen 2: Exercise Detail

**Header:**
- Back button
- Exercise name
- Muscle group badge with color

**Sections (scrollable):**

1. **Pinned Note**
   - Editable text area
   - Save button
   - Persists to `exercises.pinned_note`

2. **Last Set Info**
   - Weight × Reps (or Distance, Duration for cardio)
   - Date/time

3. **PR Selector**
   - Segmented control: 1RM, 3RM, 5RM, 8RM, 10RM
   - Shows current PR for selected rep count
   - Default selection based on `default_pr_reps`

4. **Log Set Form**
   - For strength: Weight + Reps inputs
   - For cardio: Distance + Duration inputs
   - Optional notes textarea
   - Submit button

5. **Personal Records Table**
   - List showing: 1RM, 3RM, 5RM, 8RM, 10RM
   - Each row: Rep count | Weight | Date achieved

6. **Progress Chart**
   - Line chart showing weight progression over time
   - Rep count selector to filter data
   - X-axis: Date
   - Y-axis: Weight (lbs)
   - For bodyweight exercises: Show reps progression instead

7. **Set History**
   - List of all sets for this exercise
   - Grouped by date
   - Each entry: Weight × Reps, Notes (if any), Timestamp
   - Swipe to delete
   - Tap to edit (opens edit modal)

### Screen 3: History

**Layout:**
- Grouped by date (newest first)
- Each date section shows:
  - Date header with workout label (e.g., "Push", "Pull", "Legs")
  - List of exercises worked that day
  - Expandable to show individual sets

**Workout Label Logic:**
Determine label based on muscle groups worked:
- **Push**: Chest + (Shoulders or Triceps)
- **Pull**: Back + Biceps (allow max 1 Shoulder exercise)
- **Sharms**: Shoulders + Arms
- **Legs**: Only leg exercises
- Otherwise: "MuscleGroup1 & MuscleGroup2" (most prominent groups)

**Set Entry:**
- Exercise name
- Weight × Reps (or Distance/Duration)
- Notes (if any)
- Timestamp
- Edit/Delete actions

### Screen 4: Body Weight

**Stats Cards Row:**
- Starting Weight (first log ever)
- Total Change (current - starting)
- Current Weight
- Goal Weight (tappable to edit)

**Progress Chart:**
- Line chart with weight over time
- Goal line (dashed horizontal line)
- Color coding: Green when progressing toward goal, otherwise neutral

**Add Weight Entry Form:**
- Weight input
- Date picker (default today)
- Optional notes
- Submit button

**Weight History:**
- List of all entries
- Each entry: Weight, Date, Notes
- Swipe to delete
- Tap to edit

---

## 5. KEY BUSINESS LOGIC

### Calculating Personal Records
```swift
func calculatePRs(for sets: [WorkoutSet]) -> [PersonalRecord] {
    let repTargets = [1, 3, 5, 8, 10]
    var prs: [PersonalRecord] = []

    for target in repTargets {
        // Find all sets with at least 'target' reps
        let validSets = sets.filter { ($0.reps ?? 0) >= target }

        // Get the one with highest weight
        if let best = validSets.max(by: { ($0.weight ?? 0) < ($1.weight ?? 0) }),
           let weight = best.weight {
            prs.append(PersonalRecord(reps: target, weight: weight, date: best.date))
        }
    }

    return prs
}
```

### Last Session Top Set
```swift
func getLastSessionTopSet(sets: [WorkoutSet]) -> WorkoutSet? {
    let startOfToday = Calendar.current.startOfDay(for: Date())

    // Get sets before today
    let previousSets = sets.filter { $0.date < startOfToday }

    // Group by date
    let grouped = Dictionary(grouping: previousSets) {
        Calendar.current.startOfDay(for: $0.date)
    }

    // Get most recent date
    guard let lastSessionDate = grouped.keys.max(),
          let lastSessionSets = grouped[lastSessionDate] else {
        return nil
    }

    // Return heaviest set from that session
    return lastSessionSets.max(by: { ($0.weight ?? 0) < ($1.weight ?? 0) })
}
```

### Last Set (Including Today)
```swift
func getLastSet(sets: [WorkoutSet]) -> WorkoutSet? {
    return sets.max(by: { $0.date < $1.date })
}
```

### Current Max for Rep Count
```swift
func getCurrentMax(sets: [WorkoutSet], minReps: Int) -> Double? {
    let validSets = sets.filter { ($0.reps ?? 0) >= minReps }
    return validSets.compactMap { $0.weight }.max()
}
```

### Chart Data Preparation
```swift
func prepareChartData(sets: [WorkoutSet], repFilter: Int) -> [(date: Date, weight: Double)] {
    // Filter by rep count
    let filtered = sets.filter { ($0.reps ?? 0) >= repFilter }

    // Group by day
    let grouped = Dictionary(grouping: filtered) {
        Calendar.current.startOfDay(for: $0.date)
    }

    // Get max weight per day
    let dataPoints = grouped.compactMap { (date, daySets) -> (Date, Double)? in
        guard let maxWeight = daySets.compactMap({ $0.weight }).max() else {
            return nil
        }
        return (date, maxWeight)
    }

    // Sort by date (oldest first for chart)
    return dataPoints.sorted { $0.0 < $1.0 }
}
```

### Body Weight Exercise Display
For exercises with `usesBodyWeight: true`:
- If weight is 0: Display "BW" (bodyweight only)
- If weight > 0: Display "BW + {weight}lbs"

---

## 6. DESIGN SYSTEM

### Colors

**Muscle Group Colors** (use for labels and PR boxes):
| Group | Light Mode | Dark Mode |
|-------|------------|-----------|
| Chest | Rose-700 (#BE123C) | Rose-300 (#FDA4AF) |
| Back | Blue-600 (#2563EB) | Blue-400 (#60A5FA) |
| Legs | Green-700 (#15803D) | Green-300 (#86EFAC) |
| Shoulders | Amber-700 (#B45309) | Amber-300 (#FCD34D) |
| Arms | Purple-600 (#9333EA) | Purple-400 (#C084FC) |
| Biceps | Violet-600 (#7C3AED) | Violet-400 (#A78BFA) |
| Triceps | Fuchsia-600 (#C026D3) | Fuchsia-400 (#E879F9) |
| Core | Yellow-700 (#A16207) | Yellow-300 (#FDE047) |
| Cardio | Teal-600 (#0D9488) | Teal-400 (#2DD4BF) |

**App Colors:**
- Primary Action: Blue (#2563EB)
- Success: Green (#16A34A)
- Danger: Red (#DC2626)
- Background Light: White (#FFFFFF)
- Background Dark: #0A0A0A
- Card Light: White
- Card Dark: #1F2937 (Gray-800)
- Text Light: #171717
- Text Dark: #EDEDED

**Gradient Backgrounds (Optional for headers):**
```swift
// Light mode gradient
LinearGradient(
    colors: [Color.indigo.opacity(0.1), Color.purple.opacity(0.1)],
    startPoint: .topLeading,
    endPoint: .bottomTrailing
)

// Dark mode gradient
LinearGradient(
    colors: [Color.indigo.opacity(0.15), Color.purple.opacity(0.15)],
    startPoint: .topLeading,
    endPoint: .bottomTrailing
)
```

### Typography
- Use system fonts (San Francisco)
- Headers: Bold, larger sizes
- Body: Regular weight
- Labels: Smaller, may use medium weight

### Spacing
- Standard padding: 16pt
- Card internal padding: 16-24pt
- Item gaps: 8-12pt
- Section gaps: 24pt

### Icons
Use SF Symbols (iOS native icons):
| Action | SF Symbol |
|--------|-----------|
| Add | plus |
| Back | chevron.left |
| Edit | pencil |
| Delete | trash |
| Save | checkmark |
| Cancel | xmark |
| History | clock.arrow.circlepath |
| Weight/Scale | scalemass |
| Pin | pin |
| Note | note.text |
| Expand | chevron.down |
| Collapse | chevron.up |

---

## 7. API OPERATIONS

### Fetch Exercises
```swift
// Get all exercises (base + user's custom)
let exercises = try await supabase
    .from("exercises")
    .select()
    .or("is_base.eq.true,id.in.(\(userExerciseIds.joined(separator: ",")))")
    .execute()
    .value

// Or simpler: Get user_exercises junction and join
let userExercises = try await supabase
    .from("user_exercises")
    .select("exercise_id, exercises(*)")
    .eq("user_id", value: userId)
    .execute()
```

### Fetch Sets for Exercise
```swift
let sets = try await supabase
    .from("sets")
    .select()
    .eq("exercise_id", value: exerciseId)
    .eq("user_id", value: userId)
    .order("date", ascending: false)
    .execute()
    .value as [WorkoutSet]
```

### Fetch All Sets (for History)
```swift
let sets = try await supabase
    .from("sets")
    .select("*, exercises(name, muscle_group)")
    .eq("user_id", value: userId)
    .order("date", ascending: false)
    .execute()
```

### Log New Set
```swift
// Strength set
let newSet = [
    "exercise_id": exerciseId,
    "user_id": userId,
    "weight": weight,
    "reps": reps,
    "date": ISO8601DateFormatter().string(from: Date()),
    "notes": notes
]

try await supabase.from("sets").insert(newSet).execute()
```

### Update Set
```swift
try await supabase
    .from("sets")
    .update(["weight": newWeight, "reps": newReps])
    .eq("id", value: setId)
    .execute()
```

### Delete Set
```swift
try await supabase.from("sets").delete().eq("id", value: setId).execute()
```

### Create Exercise
```swift
// 1. Create the exercise
let exercise = try await supabase
    .from("exercises")
    .insert([
        "name": name,
        "muscle_group": muscleGroup,
        "exercise_type": exerciseType,
        "is_base": false
    ])
    .select()
    .single()
    .execute()
    .value

// 2. Link to user
try await supabase
    .from("user_exercises")
    .insert([
        "user_id": userId,
        "exercise_id": exercise.id
    ])
    .execute()
```

### Update Exercise (Pinned Note, Default PR Reps)
```swift
try await supabase
    .from("exercises")
    .update(["pinned_note": note])
    .eq("id", value: exerciseId)
    .execute()
```

### Body Weight Operations
```swift
// Fetch logs
let logs = try await supabase
    .from("body_weight_logs")
    .select()
    .eq("user_id", value: userId)
    .order("date", ascending: false)
    .execute()
    .value

// Add log (also update profile)
try await supabase.from("body_weight_logs").insert([
    "user_id": userId,
    "weight": weight,
    "date": ISO8601DateFormatter().string(from: date)
]).execute()

try await supabase
    .from("user_profiles")
    .update(["current_weight": weight, "updated_at": "now()"])
    .eq("user_id", value: userId)
    .execute()
```

### Profile Operations
```swift
// Get profile
let profile = try await supabase
    .from("user_profiles")
    .select()
    .eq("user_id", value: userId)
    .single()
    .execute()
    .value

// Update goal weight
try await supabase
    .from("user_profiles")
    .update(["goal_weight": newGoal])
    .eq("user_id", value: userId)
    .execute()
```

---

## 8. IMPORTANT IMPLEMENTATION NOTES

### Date/Time Handling
- Store all dates as ISO 8601 strings in Supabase
- Use user's local timezone for display
- "Start of today" should use local timezone:
```swift
let startOfToday = Calendar.current.startOfDay(for: Date())
```

### Offline Support (Optional but Recommended)
- Cache exercises and recent sets locally (Core Data or SwiftData)
- Queue set logs when offline
- Sync when connection restored
- Show offline indicator in UI

### Error Handling
- Network errors: Show retry option
- Auth errors: Redirect to login
- Validation errors: Show inline on forms
- Use meaningful error messages

### Performance
- Paginate history (load 50 sets at a time)
- Lazy load exercise detail data
- Cache PR calculations
- Use efficient list rendering

### Haptic Feedback
- Success: Light impact when set logged
- Error: Error notification
- Selection: Selection changed

### Dark Mode
- Respect system setting
- Test all screens in both modes
- Ensure sufficient contrast

---

## 9. ASSETS TO INCLUDE

### App Icon
The app icon is a weight plate design. You'll need to create iOS app icons in these sizes:
- 20pt, 29pt, 40pt, 60pt, 76pt, 83.5pt (various @2x, @3x variants)
- Use the existing design from `public/icons/` as reference

### Logo
- Include plates logo for splash screen and about page
- Available at `public/plates-logo.png` and `public/plates-logo-filled.png`

---

## 10. TECH STACK RECOMMENDATION

- **Framework**: SwiftUI
- **Minimum iOS**: iOS 16 (for Charts framework)
- **Supabase SDK**: supabase-swift (latest)
- **Charts**: Swift Charts (built-in from iOS 16)
- **Local Storage**: SwiftData or Core Data (for offline cache)
- **Architecture**: MVVM with ObservableObject
- **Async**: Swift Concurrency (async/await)

---

## 11. TESTING CHECKLIST

Before considering the app complete, verify:

- [ ] Can sign up with email/password
- [ ] Can sign in and stay signed in
- [ ] Can sign out
- [ ] Exercises load with correct muscle group filtering
- [ ] Can create custom exercise
- [ ] Can log strength set (weight + reps)
- [ ] Can log cardio set (distance + duration)
- [ ] Quick log from home screen works
- [ ] Exercise detail shows correct PRs
- [ ] PR selector updates displayed PR
- [ ] Progress chart shows correct data
- [ ] Can edit existing set
- [ ] Can delete set
- [ ] History shows sets grouped by date
- [ ] Workout labels display correctly
- [ ] Body weight logs work
- [ ] Goal weight can be updated
- [ ] Weight chart displays correctly
- [ ] Pinned notes save and display
- [ ] Dark mode works throughout
- [ ] App works offline (if implemented)
- [ ] Data syncs correctly with web version

---

## 12. SUMMARY

Build a native SwiftUI iOS app that:

1. **Authenticates** with Supabase (email/password)
2. **Displays exercises** organized by muscle group with quick logging
3. **Tracks sets** with weight/reps or distance/duration
4. **Calculates and displays PRs** (1RM through 10RM)
5. **Shows progress charts** filtered by rep count
6. **Provides workout history** organized by date with smart labels
7. **Tracks body weight** with goal visualization
8. **Maintains design consistency** with the web version's colors and UX patterns
9. **Works with the existing Supabase backend** without any schema changes

The end result should feel like a native iOS app while providing the same functionality and data as the web version, allowing users to seamlessly switch between platforms.
