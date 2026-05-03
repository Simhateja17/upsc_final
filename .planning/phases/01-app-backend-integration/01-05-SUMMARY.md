# 01-05 Summary: JEET App Content + Planning Backend Integration

Implemented backend-backed modules in `jeet_app` for Videos, Library, Study Planner, and Syllabus Tracker.

## Completed

- Added route-accurate serializable models for:
  - video subjects, subject video lists, quiz questions/results, mentor questions
  - library subjects, chapters, materials, signed material URLs
  - study planner tasks, streaks, weekly goals, monthly activity
  - public syllabus and persisted syllabus tracker state blobs
- Added repositories that keep backend wire contracts behind the data layer:
  - `VideoRepository`
  - `LibraryRepository`
  - `StudyPlannerRepository`
  - `SyllabusRepository`
- Added retained ViewModels through `ServiceLocator`:
  - `VideoViewModel`
  - `LibraryViewModel`
  - `StudyPlannerViewModel`
  - `SyllabusTrackerViewModel`
- Updated app navigation and screen wiring:
  - video subject list loads from `/videos/subjects`
  - subject video list loads from `/videos/{subject}`
  - video watch action opens backend `videoUrl` externally through platform URI handling
  - mentor questions post to `/videos/mentor/ask`
  - library subjects load into the Prelims content tab
  - library chapters retrieve signed material URLs through `/library/download/{chapterId}`
  - study planner task state comes from `StudyPlannerViewModel.tasks`
  - task create, complete, and delete call backend study-plan routes
  - syllabus screens render backend grouped syllabus data where available
  - syllabus progress persists through `/user/syllabus-tracker`
- Added platform URL opening via `expect/actual openExternalUrl`.
- Added focused common tests for representative payload decoding, syllabus key generation, and task completion request encoding.

## Notes

- Syllabus tracker state keys use the backend coverage format:
  - `${subjectId}__${topicIndex}__${subTopicIndex}`
- Completed syllabus subtopics are saved with state `{ "status": "done" }`.
- Video playback remains external-link based for this phase.
- The existing visual layouts were preserved; static fallback data remains only for empty or failed backend states.

## Verification

- `./gradlew :composeApp:compileKotlinMetadata --rerun-tasks`
- `./gradlew :composeApp:compileDebugKotlinAndroid -q`
- `./gradlew :composeApp:compileKotlinIosSimulatorArm64 -q`
- `./gradlew :composeApp:allTests`
