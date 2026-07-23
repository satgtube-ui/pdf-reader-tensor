# Margin - personal PDF notes reader

A small, open-access, iPad-friendly notes library built with Next.js. PDFs committed to `public/notes` are discovered automatically, including PDFs inside subject folders.

## Add notes

1. Put PDF files in `public/notes`.
2. Optional: arrange them in folders such as `public/notes/biology`.
3. Commit and push the files to GitHub.
4. Vercel will rebuild the site and the PDFs will appear automatically.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

Import the GitHub repository into Vercel and accept the detected Next.js defaults. No login, environment variables, or database are required.
