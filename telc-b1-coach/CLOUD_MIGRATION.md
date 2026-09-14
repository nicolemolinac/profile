# German B1 Coach cloud deployment

The TELC B1 Coach can now run as one private Render service on laptop and phone while preserving the exact existing `telcb1` progress object.

## Deployment

Deploy the repository branch `telc-b1-pass-coach` with the root `render.yaml` on that branch. The service needs:

- `DATABASE_URL` — persistent Postgres/Neon connection string.
- `APP_USERNAME` and `APP_PASSWORD` — private HTTP Basic Auth.
- `SERVICE_TOKEN` — random secret shared only with Personal AI OS for server-to-server progress reads.

The same container serves the Vite app and `/api/progress`.

## Preserve current progress exactly

The current coach stores its exact study state under browser localStorage key `telcb1`. That object contains XP, learned vocabulary IDs, review vocabulary IDs, listening attempts/correct answers, speaking and writing completions, exam date and skill scores.

After pulling the latest branch locally, the local app shows a small `☁️ Copiar progreso para cloud` button. Click it once on the laptop. Then open the new cloud German Coach and use `Importar mi progreso anterior`. The full existing JSON is stored in cloud Postgres and becomes the canonical cross-device state.

After that first import, the cloud app hydrates progress before React starts and continuously persists later `telcb1` changes back to Postgres. Opening the app on another device restores the same state automatically.

## Personal AI OS integration

Personal AI OS reads `/api/progress` through `GERMAN_API_URL` with `GERMAN_SERVICE_TOKEN` and converts the same TELC progress into the Chief widget's four skills: Vocabulary, Listening, Writing and Speaking. Reading is intentionally excluded.
