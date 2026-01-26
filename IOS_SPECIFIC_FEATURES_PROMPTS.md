# iOS Implementation Prompts: Body Weight Exercises & Add Exercise Feature

These are detailed prompts to give to a GAI to implement two specific features that require extra attention.

---

## PROMPT 1: Body Weight Exercise Support

### Context
The app supports "body weight exercises" like pull-ups, dips, and chin-ups. These exercises are different from regular strength exercises because:
1. The user's body provides the base resistance
2. The "weight" field represents ADDED weight (e.g., a weighted vest or belt)
3. Weight of 0 means bodyweight only
4. Progress is tracked primarily by REPS rather than weight

### Database Field
Exercises have a `uses_body_weight: BOOLEAN` field. When `true`, the exercise is a body weight exercise.

### Prompt for GAI

```
Implement body weight exercise support for the iOS Plates app. Body weight exercises (like pull-ups, dips, chin-ups) have `usesBodyWeight: true` in the Exercise model.

**Key Differences from Regular Strength Exercises:**

1. **Weight Display Format**
   - Regular exercise: Show weight as "225 lbs"
   - Body weight exercise:
     - If weight = 0: Display "BW" (bodyweight only)
     - If weight > 0: Display "BW + {weight} lbs" (e.g., "BW + 25 lbs")

   Swift helper function:
   ```swift
   func formatWeight(_ weight: Double, usesBodyWeight: Bool) -> String {
       if !usesBodyWeight {
           return "\(weight) lbs"
       }
       return weight > 0 ? "BW + \(weight) lbs" : "BW"
   }
   ```

2. **Exercise Card Quick Log Form**
   - Regular exercise: Show Weight input + "x" + Reps input
   - Body weight exercise: Show ONLY Reps input (hide weight field entirely)
   - When logging with hidden weight field, send weight = 0 to API

   The card should look like:
   ```
   [Pull-ups]
   Back

   Last Session | Last Set | 8RM PR
   BW + 10 x 12 | BW x 8   | BW + 25 lbs

   Quick Log:
   [   Reps   ] [+ Add]    <- Only reps input, no weight
   ```

3. **Set Logging Validation**
   - Regular exercise: weight must be > 0, reps must be > 0
   - Body weight exercise: weight CAN be 0 (or greater), reps must be > 0

   ```swift
   func validateSetInput(exercise: Exercise, weight: Double, reps: Int) -> Bool {
       if reps <= 0 { return false }
       if !exercise.usesBodyWeight && weight <= 0 { return false }
       return true
   }
   ```

4. **Progress Chart Behavior**
   - Regular exercise: Chart shows WEIGHT progression over time, with a rep count filter
   - Body weight exercise: Chart shows REPS progression over time (max reps per day)

   For body weight chart:
   - X-axis: Date
   - Y-axis: Reps (not weight)
   - Data points: Maximum reps achieved each day
   - No rep filter dropdown needed

   ```swift
   // For body weight exercises
   func prepareBodyWeightChartData(sets: [WorkoutSet]) -> [(date: Date, reps: Int)] {
       // Group sets by day
       var byDay: [Date: WorkoutSet] = [:]

       for set in sets {
           guard let reps = set.reps, reps > 0 else { continue }
           let dayStart = Calendar.current.startOfDay(for: set.date)

           if let existing = byDay[dayStart] {
               // Keep the set with more reps
               if reps > (existing.reps ?? 0) {
                   byDay[dayStart] = set
               }
           } else {
               byDay[dayStart] = set
           }
       }

       // Sort by date (oldest first for chart)
       return byDay
           .map { (date: $0.key, reps: $0.value.reps ?? 0) }
           .sorted { $0.date < $1.date }
   }
   ```

5. **PR Display**
   - Regular exercise: "225 lbs"
   - Body weight exercise: "BW" or "BW + 25 lbs"

   PRs are still calculated the same way (max weight for N or more reps), but displayed differently.

6. **PR List Component**
   Each PR card shows the rep max (1RM, 3RM, etc.) with the weight formatted appropriately:
   ```
   [Award Icon] 8RM          [NEW] <- if within last 7 days
   BW + 25 lbs
   Jan 15, 2024
   ```

7. **Set Log Form on Detail Page**
   - Regular exercise: Weight field + Reps field + Notes
   - Body weight exercise:
     - Weight field with label "Added Weight (optional)"
     - Pre-filled with 0
     - Placeholder text: "0 for bodyweight only"
     - Reps field + Notes

8. **History Display**
   Format history entries using the same weight display logic:
   - "BW x 12" for bodyweight only
   - "BW + 25 x 8" for weighted

**Testing Checklist:**
- [ ] Create a new exercise with "Uses body weight" toggle ON
- [ ] Exercise card shows only Reps input in quick log
- [ ] Logging "0 weight" works and displays as "BW"
- [ ] Logging with added weight displays as "BW + X"
- [ ] Progress chart shows reps on Y-axis, not weight
- [ ] Chart displays max reps per day over time
- [ ] PR list shows "BW" or "BW + X lbs" format
- [ ] History entries show correct format
- [ ] Stats cards (Last Session, Last Set, PR) use correct format
```

---

## PROMPT 2: Add Exercise Modal

### Context
Users can add custom exercises to their workout list. The modal supports:
1. Creating entirely new exercises
2. Adding existing exercises from the database to their personal list
3. Autocomplete suggestions while typing
4. Different fields for strength vs cardio exercises
5. Optional initial PR/session to seed data

### Database Flow
1. Check if exercise with same name + muscle group exists
2. If exists: Link it to user via `user_exercises` table
3. If not: Create new exercise, then link to user
4. Optionally create initial set with PR data

### Prompt for GAI

```
Implement the Add Exercise feature for the iOS Plates app. This allows users to add custom exercises to their workout list.

**Modal Structure:**

1. **Header**
   - Title: "Add New Exercise"
   - Close button (X icon) in top right

2. **Form Fields:**

   a) **Exercise Name** (required)
   - Text input with autocomplete
   - As user types, show dropdown with matching exercises from database
   - Search matches both exercise name AND muscle group
   - Limit to 6 suggestions
   - Each suggestion shows: Exercise name + Muscle group (colored by group)
   - Selecting a suggestion auto-fills: name, type, muscle group, default PR reps, uses_body_weight

   ```swift
   struct ExerciseSuggestion: View {
       let exercise: Exercise

       var body: some View {
           HStack {
               Text(exercise.name)
                   .font(.subheadline)
                   .fontWeight(.medium)
               Spacer()
               Text(exercise.muscleGroup.rawValue)
                   .font(.caption)
                   .foregroundColor(muscleGroupColor(exercise.muscleGroup))
           }
       }
   }
   ```

   b) **Exercise Type** (required)
   - Segmented control or picker: "Strength Training" | "Cardio"
   - Default: Strength Training
   - Changing type shows/hides relevant fields

   c) **Muscle Group** (required, only for Strength)
   - Picker with options: Chest, Back, Legs, Shoulders, Biceps, Triceps, Core
   - Note: "Cardio" type auto-sets muscle group to "Cardio"

   d) **Default PR Reps** (optional, only for Strength)
   - Number input, 1-50
   - Placeholder: "3"
   - Help text: "The rep max to display on the card (defaults to 3)"

   e) **Uses Body Weight** (only for Strength)
   - Toggle switch
   - Label: "Uses body weight"
   - Help text: "For exercises like pull-ups or dips where you add weight to body weight"

   f) **Initial PR** (optional, only for Strength)
   - Two inputs side by side: Reps [x] Weight
   - Help text: "Add your current PR if you know it (e.g., 5 reps x 225 lbs)"
   - Both must be filled or both empty
   - Creates an initial set in the database

   g) **Initial Session** (optional, only for Cardio)
   - Two inputs side by side: Distance [/] Minutes
   - Help text: "Add your initial session if you would like (e.g., 3.5 miles / 30 minutes)"
   - Both must be filled or both empty
   - Creates an initial set in the database

3. **Validation Rules:**
   - Name is required
   - If strength: Muscle group is required
   - If strength with initial PR: Both reps AND weight must be provided (or both empty)
   - If cardio with initial session: Both distance AND duration must be provided (or both empty)
   - Default PR reps (if provided) must be 1-50

4. **Submit Button**
   - Text: "Add Exercise" with plus icon
   - Disabled if: name empty, submitting, or validation fails
   - Show loading state while submitting

5. **Cancel Button**
   - Dismisses modal
   - Resets all form fields

**API Integration:**

Step 1: Create/Find Exercise
```swift
func addExercise() async throws -> Exercise {
    let payload: [String: Any] = [
        "name": exerciseName.trimmingCharacters(in: .whitespaces),
        "muscle_group": exerciseType == .cardio ? "Cardio" : muscleGroup.rawValue,
        "exercise_type": exerciseType.rawValue,
        "default_pr_reps": exerciseType == .strength ? (defaultPrReps ?? 3) : 1,
        "uses_body_weight": exerciseType == .strength ? usesBodyWeight : false
    ]

    // POST to /api/exercises (or Supabase directly)
    // API handles:
    // 1. Check if exercise with same name+muscle_group exists
    // 2. If exists, use it; if not, create it
    // 3. Link to user via user_exercises table (upsert)
    // 4. Return the exercise
}
```

Step 2: Create Initial Set (if provided)
```swift
// For strength exercise with initial PR
if exerciseType == .strength, let weight = prWeight, let reps = prReps, weight > 0, reps > 0 {
    try await supabase
        .from("sets")
        .insert([
            "exercise_id": newExercise.id,
            "user_id": userId,
            "weight": weight,
            "reps": reps,
            "date": ISO8601DateFormatter().string(from: Date())
        ])
        .execute()
}

// For cardio exercise with initial session
if exerciseType == .cardio, let distance = prDistance, let duration = prDuration, distance > 0, duration > 0 {
    try await supabase
        .from("sets")
        .insert([
            "exercise_id": newExercise.id,
            "user_id": userId,
            "distance": distance,
            "duration": duration,
            "date": ISO8601DateFormatter().string(from: Date())
        ])
        .execute()
}
```

**Autocomplete Implementation:**

```swift
@Published var exerciseName: String = ""
@Published var allExercises: [Exercise] = []
@Published var suggestions: [Exercise] = []
@Published var showSuggestions: Bool = false

// Fetch all exercises when modal opens
func fetchAllExercises() async {
    // GET /api/exercises/all (returns ALL exercises in database)
    // Store in allExercises
}

// Filter suggestions as user types
func updateSuggestions() {
    guard exerciseName.count >= 1 else {
        suggestions = []
        showSuggestions = false
        return
    }

    let searchTerm = exerciseName.lowercased().trimmingCharacters(in: .whitespaces)

    suggestions = allExercises
        .filter { exercise in
            exercise.name.lowercased().contains(searchTerm) ||
            exercise.muscleGroup.rawValue.lowercased().contains(searchTerm)
        }
        .prefix(6)
        .map { $0 }

    showSuggestions = !suggestions.isEmpty
}

// When user selects a suggestion
func selectSuggestion(_ exercise: Exercise) {
    exerciseName = exercise.name
    exerciseType = exercise.exerciseType

    if exercise.exerciseType == .strength {
        muscleGroup = exercise.muscleGroup
        defaultPrReps = exercise.defaultPrReps
        usesBodyWeight = exercise.usesBodyWeight
    }

    showSuggestions = false
}
```

**SwiftUI View Structure:**

```swift
struct AddExerciseModal: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddExerciseViewModel()

    var body: some View {
        NavigationView {
            Form {
                // Exercise Name with autocomplete
                Section {
                    TextField("e.g., Bench Press", text: $viewModel.exerciseName)
                        .autocapitalization(.words)

                    if viewModel.showSuggestions {
                        ForEach(viewModel.suggestions) { exercise in
                            Button {
                                viewModel.selectSuggestion(exercise)
                            } label: {
                                ExerciseSuggestionRow(exercise: exercise)
                            }
                        }
                    }
                } header: {
                    Text("Exercise Name")
                }

                // Exercise Type
                Section {
                    Picker("Type", selection: $viewModel.exerciseType) {
                        Text("Strength Training").tag(ExerciseType.strength)
                        Text("Cardio").tag(ExerciseType.cardio)
                    }
                    .pickerStyle(.segmented)
                }

                // Strength-specific fields
                if viewModel.exerciseType == .strength {
                    Section {
                        Picker("Muscle Group", selection: $viewModel.muscleGroup) {
                            ForEach(strengthMuscleGroups, id: \.self) { group in
                                Text(group.rawValue).tag(group)
                            }
                        }
                    }

                    Section {
                        TextField("3", value: $viewModel.defaultPrReps, format: .number)
                            .keyboardType(.numberPad)
                    } header: {
                        Text("Default PR Reps")
                    } footer: {
                        Text("The rep max to display on the card (defaults to 3)")
                    }

                    Section {
                        Toggle("Uses body weight", isOn: $viewModel.usesBodyWeight)
                    } footer: {
                        Text("For exercises like pull-ups or dips where you add weight to body weight")
                    }

                    Section {
                        HStack {
                            TextField("Reps", value: $viewModel.prReps, format: .number)
                                .keyboardType(.numberPad)
                            Text("x")
                                .foregroundColor(.secondary)
                            TextField("Weight", value: $viewModel.prWeight, format: .number)
                                .keyboardType(.decimalPad)
                        }
                    } header: {
                        Text("Initial PR (Optional)")
                    } footer: {
                        Text("Add your current PR if you know it (e.g., 5 reps x 225 lbs)")
                    }
                }

                // Cardio-specific fields
                if viewModel.exerciseType == .cardio {
                    Section {
                        HStack {
                            TextField("Distance", value: $viewModel.prDistance, format: .number)
                                .keyboardType(.decimalPad)
                            Text("/")
                                .foregroundColor(.secondary)
                            TextField("Minutes", value: $viewModel.prDuration, format: .number)
                                .keyboardType(.numberPad)
                        }
                    } header: {
                        Text("Initial Session (Optional)")
                    } footer: {
                        Text("Add your initial session if you would like (e.g., 3.5 miles / 30 minutes)")
                    }
                }

                // Error message
                if let error = viewModel.error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Add New Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task {
                            await viewModel.submit()
                            if viewModel.error == nil {
                                dismiss()
                            }
                        }
                    } label: {
                        if viewModel.isSubmitting {
                            ProgressView()
                        } else {
                            Label("Add", systemImage: "plus")
                        }
                    }
                    .disabled(!viewModel.isValid || viewModel.isSubmitting)
                }
            }
        }
    }
}
```

**Muscle Group Colors for Suggestions:**
```swift
func muscleGroupColor(_ group: MuscleGroup) -> Color {
    switch group {
    case .chest: return .pink
    case .back: return .blue
    case .legs: return .green
    case .shoulders: return .orange
    case .biceps: return .purple
    case .triceps: return Color(red: 0.75, green: 0.15, blue: 0.83) // Fuchsia
    case .core: return .yellow
    case .cardio: return .teal
    default: return .gray
    }
}
```

**Testing Checklist:**
- [ ] Modal opens from home screen (FAB or header button)
- [ ] Can type exercise name and see autocomplete suggestions
- [ ] Suggestions show exercise name + colored muscle group
- [ ] Selecting suggestion auto-fills all relevant fields
- [ ] Switching to Cardio hides strength-specific fields
- [ ] Switching to Strength shows strength-specific fields
- [ ] "Uses body weight" toggle works
- [ ] Can submit with just name and muscle group (minimum required)
- [ ] Can submit with initial PR (strength) - creates exercise AND set
- [ ] Can submit with initial session (cardio) - creates exercise AND set
- [ ] Validation: partial PR fields show error (need both or neither)
- [ ] New exercise appears in exercise list after creation
- [ ] Adding existing exercise links it to user (doesn't duplicate)
- [ ] Cancel button dismisses and resets form
- [ ] Loading state shows during submission
- [ ] Error messages display properly
```

---

## Summary

These two prompts cover the most complex features that need special attention:

1. **Body Weight Exercises** - A fundamental exercise type that behaves differently throughout the app (display, input, charts, PRs)

2. **Add Exercise Modal** - A feature-rich form with autocomplete, conditional fields, validation, and multi-step API operations

Give each prompt separately to the AI, or include them together if building the full app. The prompts include:
- Exact behavior specifications
- Swift code examples
- UI structure guidance
- Validation rules
- Testing checklists
