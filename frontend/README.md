# Frontend

The application is documented in [../README.md](../README.md). Run `npm run dev` here and open http://localhost:3000.

The app uses a same-origin `/api/engine` route, which invokes `../backend/engine.py`. The backend virtual environment is detected automatically. `TRAB_PYTHON` can override the interpreter path.

`npm run lint` and `npm run build` verify the frontend. There are no live cloud, GPU, voice, or realtime services implicitly configured.
