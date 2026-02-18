# Smart Bookmarks 🔖

A real-time, secure bookmark manager built with **Next.js 15**, **TypeScript**, and **Supabase**. This application allows users to save, manage, and sync bookmarks instantly across multiple devices and tabs using WebSockets.

## 🚀 Tech Stack

* **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS
* **Backend:** Supabase (PostgreSQL, Auth, Realtime)
* **Authentication:** Google OAuth 2.0
* **Styling:** Tailwind CSS for responsive design

---

## ✨ Features

* **⚡ Real-time Sync:** Bookmarks appear instantly on all connected devices without refreshing (using Supabase Realtime).
* **🔒 Row Level Security (RLS):** Data is secured at the database level; users can only access their own data.
* **📱 Mobile Optimized:** Fully responsive UI that works seamlessly on desktop and mobile.
* **🔑 Secure Auth:** Google Sign-In with session management and persistent logins.
* **❤️ Favorites:** Simple "star" functionality to highlight important links.

---

## 🛠️ Challenges & Solutions

During development, I encountered several specific challenges. Here is how I solved them:

### 1. The "Localhost" Mobile Redirect Loop
**Problem:**The Scenario:
You are on your phone (IP: 192.168.0.121). You click "Login". You go to Google, sign in, and Google sends you back to your Next.js server. Suddenly, your phone tries to load localhost:3000 and crashes.

The "Why" (Root Cause):
When your Next.js server receives the "Callback" from Google, it needs to decide where to send the user next.

By default, many setups use a hardcoded environment variable (e.g., NEXT_PUBLIC_SITE_URL=http://localhost:3000).

The server blindly says: "Okay, login successful! Go to NEXT_PUBLIC_SITE_URL."

Your phone obeys, tries to open localhost (which is the phone itself, not your laptop), and finds nothing.
**Solution:**
* I updated `next.config.ts` to whitelist my specific Network IP in `allowedOrigins`.
* I rewrote the Auth Callback route (`src/app/auth/callback/route.ts`) to dynamically read the `Host` header from the request. Instead of relying on a static `SITE_URL` env variable, the app now intelligently redirects the user back to **whichever** address they started from (Localhost, Wi-Fi IP, or ngrok).
* Instead of trusting a static variable, we made the server ask the request where it came from.

The Code: const host = request.headers.get('host')
The Logic: If the request came from 192.168.0.121, the host header will be 192.168.0.121. If it came from ngrok.io, the header will be ngrok.io.
The Fix: We construct the redirect URL dynamically: https://${host}/dashboard. This guarantees the user lands exactly where they started.

### 2. Real-time Latency on "Add"
**Problem:** Deleting a bookmark was instant, but adding a new one required a manual refresh to see it in the list.
*The Scenario:
You added a bookmark. The database received it (you saw it in the dashboard), but your frontend list didn't update until you refreshed.
The "Why" (Root Cause):
This is a security feature of Row Level Security (RLS).
The Insert: You insert a row.
The Broadcast: Supabase's Realtime engine sees the new row and wants to shout: "Hey everyone! A new bookmark was added!"
The Block: Before shouting, the engine checks the RLS policy. It asks: "Is this listener allowed to see this row?"
The Confusion: Because the connection was generic (.on('postgres_changes')), the database was hesitant to broadcast the data immediately, often resulting in "silent" successes or delays while it verified permissions.
**Solution:**
* **Database:** I modified the Supabase Realtime subscription to include a `filter: 'user_id=eq.${user.id}'`. This ensures the client strictly listens to events for the current user, improving security and speed.
* **Frontend:** I chained `.select()` to the Supabase insert query. This forces the database to return the newly created row immediately, allowing me to update the UI state instantly without waiting for a separate fetch.
* We changed the listener to be specific, not generic.
  

### 3. Google Account Switching
**Problem:** After the first login, Google would automatically sign me in without asking which account to use, making it hard to test multiple users.
**Solution:**
* We added a specific query parameter to the login request.
* I added `{ prompt: 'consent' }` to the `queryParams` in the `signInWithOAuth` function. This forces Google to show the account chooser every time a user clicks "Sign In".
* Why it matters: This is critical for development (testing multiple accounts) and for security (ensuring users on public computers explicitly authorize the app).


---


## 📦 Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/smart-bookmarks.git](https://github.com/your-username/smart-bookmarks.git)
    cd smart-bookmarks
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🗄️ Database Schema

The project uses a simple, efficient schema in Supabase:

**Table: `bookmarks`**
* `id` (int8, PK)
* `created_at` (timestamptz)
* `title` (text)
* `url` (text)
* `user_id` (uuid, FK to auth.users)
* `is_favorite` (boolean)

**Security Policy:**
A strict RLS policy enables full CRUD operations **only** where `auth.uid() = user_id`.

---

## 🔮 Future Improvements

* **Link Preview:** Automatically fetch metadata (OG Tags) to show link thumbnails and descriptions.
* **Categorization:** Re-implement the Tags/Collections feature (which was scoped out for this MVP) to organize links.
* **Search:** Add a client-side fuzzy search to filter bookmarks instantly.
