This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First install all necessary packages:
```bash
npm install
```
Then run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Auth
Auth was set up using SIPB's [petrock](https://petrock.mit.edu/). They should be hosting it for the forseeable future, but if it ever goes down we'll need to get another openID provider for that works for MIT student login.

This [guide](https://blog.antosubash.com/posts/openid-connect-with-nextjs) was used in order to set up auth for the website.

## TailwindCSS
For better or for worse we used a lot of tailwindCSS for the styling here. The docs can be found [here](https://tailwindcss.com/docs/installation/using-vite).
