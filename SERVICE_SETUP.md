# Local Service Setup

Use the project files below; do not paste service secrets into chat.

- `backend/.env`: Deepgram key, Supabase secret, compute limits.
- `frontend/.env.local`: Supabase publishable configuration only.
- Example files are retained next to both files. Existing personal configuration is never overwritten by the setup step.

## Supabase (hosted Free project)

1. Open https://supabase.com/dashboard and create a project named `trabecular`. Choose the Free plan, a region near your deployment, and a strong database password saved privately. We do not need that database password in the frontend.
2. Wait until the project is ready. Use the **Connect** dialog to obtain the project URL and publishable key, or **Settings → API Keys** to find/create the project keys.
3. In `backend/.env`, fill:
   ```dotenv
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_YOUR_SERVER_KEY
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
   ```
4. In `frontend/.env.local`, fill:
   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
   ```
5. In Supabase **SQL Editor**, open a new query, paste `backend/migrations/001_workspace.sql`, and run it. This creates the tables, owner-read Row Level Security, and the **private** `trab-artifacts` bucket. Run the current migration again if you used an earlier version: case/revision/job mutations now go through the validated backend API, so browser clients cannot forge completed jobs or immutable inputs.
6. In **Authentication → URL Configuration**, set the development Site URL to `http://localhost:3000` and add `http://localhost:3000/**` to redirect URLs. Add the deployed HTTPS URL when we have it. Keep email confirmation enabled; the sign-in screen will use your configured email flow.
7. Keep `TRAB_STORAGE_MODE=local` and `TRAB_AUTH_MODE=local` during the current backend integration. We will explicitly switch both to `supabase` after the application's sign-in and hosted repository checks pass; entering keys alone does not silently migrate data.

Use the modern publishable/secret key names. The secret key bypasses RLS and must remain on the backend; our backend still checks the signed-in user's workspace ownership. A legacy `service_role` key can be accepted through the compatibility environment name if needed, but it is not required for a new project.

Reference: https://supabase.com/docs/guides/getting-started/api-keys

## Deepgram

1. Open https://console.deepgram.com/ and select the project you want to use.
2. In **API Keys**, create a private backend key with the permissions needed for temporary-token issuance (Deepgram currently documents Member permissions for this flow).
3. Set `DEEPGRAM_API_KEY` in `backend/.env`. The implemented browser connection uses inline Nova-3 listening, GPT-4o-mini thinking and Aura-2 Thalia speaking settings. A saved agent ID is not required. A live provider session still needs to be verified after your key is configured.
4. The browser will receive only a short-lived token from our authenticated backend. Do not put the permanent key in any `NEXT_PUBLIC_...` variable.

Reference: https://developers.deepgram.com/guides/fundamentals/token-based-authentication

## Modal

**Current decision — October 31, 2026:** use local compute. Modal GPU access requires a valid payment method, and this account's GPU request was rejected. The advertised $30 credit is not proof of usable unverified-account capacity. A CPU attempt did execute but failed compilation; official documentation does not specify a guaranteed no-payment CPU allowance. Both cloud routes are disabled. See [access verification](docs/verification/MODAL_ACCESS.md). Keep `TRAB_CLOUD_ENABLED=false`; no additional service setup is needed for current development.

The Modal SDK is installed in the project virtual environment. From the project root run:

```powershell
backend/.venv/Scripts/python.exe -m modal setup
```

Complete the login in your own browser. Modal stores its CLI credential locally; alternatively fill `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET` in `backend/.env`.

We are budgeting against the single $30/month credit balance you specified. The default development device is your RTX 3050 (4 GB); the 3D cantilever benchmark has already run there. Full-jaw memory/fidelity feasibility is a separate check.

Development controls:

```dotenv
TRAB_COMPUTE_DEVICE=cuda:0
TRAB_CLOUD_ENABLED=false
TRAB_CLOUD_BUDGET_USD=30
TRAB_CLOUD_CONCURRENCY=1
TRAB_CLOUD_MAX_SECONDS=180
```

Cloud execution is opt-in. The intended worker configuration scales to zero (`min_containers=0`), allows one cloud worker, limits solve duration, and reuses matching cached geometry/results. A local solver error does not automatically trigger a paid cloud run. Provider usage reporting can lag, so application estimates do not replace the provider's own spending limits and balance monitoring. We will inspect actual remaining credits and measured job cost before enabling the cloud route.

Reference: https://modal.com/docs/guide/getting-started

## Verify without exposing keys

After saving, restart the frontend development server so its public environment configuration is rebuilt. Restart the local analysis service with the helper below (finish or cancel active jobs first):

```powershell
./backend/Restart-LocalService.ps1
```

The helper verifies the project/process and refuses to interrupt active jobs. It opens no visible console and never prints keys. You can then run:

```powershell
backend/.venv/Scripts/python.exe backend/check_configuration.py
```

This prints configured/missing states only, never key values. Tell me **"keys configured"** when ready; no secret text is needed here. The local solver and UI work continue independently of this setup.


## Presentation Deepgram integration (November 1)

The owner requested live Deepgram in `demo/`. Local serving reads `demo/.env.local`, `demo/.env` and the existing `backend/.env` without printing keys. Add `DEEPGRAM_API_KEY` to the Vercel project server Environment Variables and redeploy; never use a frontend-public prefix. The demo now includes the token/config functions and actual streaming copilot. See [configuration and checks](docs/verification/DEEPGRAM_CHECKS.md). Supabase remains deferred and Modal execution disabled.
