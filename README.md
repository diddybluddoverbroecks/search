# messagetime

A discreet chat hidden behind a Google-lookalike search page.

- Type `messagetime` in the search bar to enter the chat.
- Any other query searches real Google.
- Switching tabs / windows instantly returns you to the fake search page.
- Chat has: name picker, profanity filter, URL linkification, image/GIF URLs.

## Run locally

    npm install
    npm start

Then open http://localhost:3000 and type `messagetime`.

## Deploy to Render

1. Push this repo to GitHub.
2. Render -> New -> Web Service -> connect the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Environment: Node 18+

The server listens on `process.env.PORT` and `0.0.0.0`.

## Limitations

- This is a novelty disguise, not security. Anyone who knows the trigger
  word can enter the chat, and DevTools reveals everything.
- Render free tier spins down after inactivity; the first load may take
  30-60s and the socket disconnects when idle.
- Images are passed by URL only (no uploads) so nothing is stored.
