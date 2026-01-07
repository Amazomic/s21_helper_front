
# School 21 Portal

A modern, responsive web interface designed for School 21 students. This application provides a comprehensive dashboard to track progress, manage projects, visualize skills, and interact with the peer community through Telegram integration.

## ✨ Features

### 👤 **Student Dashboard**
- **Profile Overview**: View current Level, XP, Coalition rank, Wallet (Coins), and Peer Review Points (PRP).
- **Experience History**: Visual trajectory graph of XP gain over time.
- **Skills Matrix**: Interactive visualization of acquired skills and their levels.
- **Active Projects**: Quick access to projects currently `IN_PROGRESS`, `IN_REVIEWS`, or `WAITING_FOR_CORRECTION`.

### 🔍 **Peer Search & Interaction**
- **Project Search**: Find other students working on specific projects (e.g., `CPP`, `ft_printf`) across different campuses.
- **Participant Details**: View detailed stats of other students without leaving the search context.
- **Telegram Integration**:
  - **Link Account**: Connect your Telegram account via the WebApp or Bot.
  - **Privacy Controls**: Choose between `Public` (username visible), `Notify Only` (allow anonymous bot notifications), or `Private`.
  - **Direct Messaging**: Quickly open Telegram chats with peers who have linked their accounts.
  - **Bot Notifications**: Send "nudge" notifications to peers for reviews if they have enabled it.

### 🛠 **Developer Tools**
- **Debug View**: A built-in API explorer to test endpoints (`/v1/participants`, `/v1/projects`, `/v1/events`, etc.) directly from the UI.
- **Data Caching**: LocalStorage caching for heavy requests (Graph, Campuses) to improve performance.

### 🎨 **UI/UX**
- **Dark Mode**: Fully supported dark theme that syncs with system settings or Telegram WebApp color scheme.
- **Mobile First**: Optimized for mobile devices and Telegram WebApp embedding.
- **Responsive Design**: Adapts seamlessly to desktop views.

## 🚀 Tech Stack

- **Framework**: [React](https://react.dev/) (TypeScript)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Hooks & LocalStorage
- **Icons**: Heroicons (SVG)

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Amazomic/school21.git
   cd school21
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```

> **Note on API Access**: This application relies on specific proxy endpoints (`/api-proxy`, `/auth-proxy`) to communicate with the School 21 API and handle OAuth tokens. To run this successfully locally, you must ensure these proxies are correctly configured in `vite.config.ts` or that you have a backend service handling these routes.

## 📱 Telegram WebApp

This application is designed to function as a Telegram Web App (TWA).
- It detects the `window.Telegram.WebApp` environment.
- It automatically adapts the theme (Light/Dark) based on the Telegram client settings.
- It utilizes `initData` for secure account linking.

## 🤝 Credits

Powered by [@amazomic](https://t.me/Amazomic).
