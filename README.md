# Margin — personal PDF notes reader

A small, iPad-friendly notes library built with Next.js. PDFs committed to `public/notes` are discovered automatically, including PDFs inside subject folders.

## Login

The default credentials are:

- Username: `student`
- Password: `study123`

Change them in `lib/auth-config.ts` before deployment. The login is intentionally simple and suitable only for a personal study site. Anyone with access to the repository can read the credentials.

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

Import the GitHub repository into Vercel and accept the detected Next.js defaults. No environment variables or database are required.
