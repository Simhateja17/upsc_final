# 01-04 JEET Study Tools Backend Integration Summary

## Implemented

- Added backend-backed Kotlin domain contracts for Mock Tests, PYQ, Flashcards, and Mindmaps in `StudyToolModels.kt`.
- Added repository adapters in `StudyToolRepositories.kt` using the backend-accurate routes from `upsc_frontend/lib/services.ts`.
- Reused the existing Ktor multipart approach for typed/file answer submissions:
  - Mock mains fields: `mockTestQuestionId`, `answerText`, `file`
  - PYQ mains fields: `answerText`, `file`
- Added retained ViewModels for each study tool:
  - `MockTestViewModel`
  - `PyqViewModel`
  - `FlashcardViewModel`
  - `MindmapViewModel`
- Wired `ServiceLocator` and `App.kt` so generated mock tests, selected questions, PYQ filters, flashcard state, and mindmap selections survive screen navigation.
- Updated navigation payloads:
  - `FlashcardStudy(subjectId, topicId)`
  - `MindMapView(subjectId, mindmapId)`
- Wired screens to backend state for:
  - Mock test subjects/stats/generation/questions/prelims submit/mains answer submit
  - PYQ question listing, answer selection, review, and mains typed evaluation
  - Flashcard subjects/topics/cards/create/progress
  - Mindmap subjects/list/detail/progress

## Verification

Passed:

```bash
cd jeet_app
./gradlew :composeApp:compileKotlinMetadata
./gradlew :composeApp:compileDebugKotlinAndroid -q
./gradlew :composeApp:compileKotlinIosSimulatorArm64 -q
```

## Notes

- Existing visual direction was preserved; the work focuses on backend wiring rather than redesign.
- Some legacy PYQ setup/subtopic screens still present their existing curated taxonomy, but they now share the retained `PyqViewModel` and the question/review/evaluation screens use backend data.
- iOS image picking remains limited to the existing 01-03 picker capability.
