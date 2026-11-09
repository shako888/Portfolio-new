/* All public projects shown in the gallery and the command palette.
   Live stats (stars, last push) are merged in from the GitHub API at runtime (gallery.js).
   Optional fields:
     repo      "owner/name" when the repo lives outside jjtjtyt6644 (used for live data + README)
     website   project website visitors get instead of a GitHub link
     role      Junyu's role when it isn't his own repo */
export const PROJECTS = [
  {
    name: 'Quillwave',
    desc: 'All your AI news in one sitting: nearly 100 sources in one ranked feed, an assistant that briefs you in a minute, and notes that keep up with you. A Windows desktop app built with Electron, a Python news scanner and a Firebase backend.',
    lang: 'JavaScript',
    tags: ['ai', 'tools'],
    repo: 'stephanieloveshotpot/ai-news-downloader', // public installer repo: live release data only
    website: 'https://quillwave-app.web.app/',
    role: 'Lead developer',
    url: 'https://quillwave-app.web.app/',
    // Shown in the project panel instead of a README (the app's own repo is private)
    about: [
      { title: 'Read', items: [
        'Nearly 100 sources in five groups: Hacker News, arXiv (cs.AI, cs.LG, cs.CL), AI lab and company blogs, the tech press, and the community (newsletters, researchers’ blogs, AI subreddits).',
        'A ranked “For you” feed, plus Everything, Unread, Since last visit, Bookmarks and Notes. The same story from several sources shows as one row.',
        'A clean full-article reader with reading time and progress; arXiv papers open as full text. Live scans on your schedule, with search, sorting and muted topics.',
      ] },
      { title: 'Ask', items: [
        'An assistant that searches your feed, reads full articles and answers with links to the stories it used.',
        '“Brief me” sums up the day’s AI news in about a minute; “Key points” works on any story or a selected passage. It can read your notes too.',
        'The assistant runs through Quillwave’s own server, so the app itself contains no AI keys.',
      ] },
      { title: 'Keep', items: [
        'Notes beside the article with live formatting, #tags, templates and Markdown export (for Obsidian or Notion), synced to your account.',
        'Highlights in articles and notes, bookmarks, a reading streak with a weekly goal, and share cards.',
        'Notifications for big stories, keyword alerts and a morning digest; light, dark and high-contrast themes; full keyboard shortcuts.',
      ] },
      { title: 'How it’s built', items: [
        'Electron app (main process, a narrow preload bridge and a plain HTML/CSS/JS interface) with the assistant’s tools, article extraction and a self-updater.',
        'A Python news scanner compiled into its own quillwave-scanner.exe; the app runs it and reads the JSON it prints.',
        'Website and API on Firebase (Hosting, Cloud Functions, Firestore) for accounts, the assistant and sync.',
        'A custom C# / WPF installer that installs per-user without admin rights and updates the app automatically, verifying each download.',
      ] },
      { title: 'Get it', items: [
        'Free for Windows 10 and 11 (64-bit). The open beta runs until 16 Nov 2026. Get it at quillwave-app.web.app.',
        'The installer isn’t code-signed yet: if Windows SmartScreen warns, choose More info, then Run anyway.',
      ] },
    ],
  },
  {
    name: 'RobloxAccountManager',
    desc: 'Runs several Roblox accounts side by side from one small Windows app, with auto-reconnect, memory and CPU savers for background windows, performance profiles and self-updates. About 3 MB of RAM when minimised.',
    lang: 'Rust',
    tags: ['tools'],
    url: 'https://github.com/jjtjtyt6644/RobloxAccountManager',
  },
  {
    name: 'CompTools',
    desc: 'All-in-one Windows system utility: WMI hardware diagnostics, one-click winget installs with a live console, OEM debloat, gaming and network tweaks, and Firebase cloud sync.',
    lang: 'C#',
    tags: ['tools'],
    url: 'https://github.com/jjtjtyt6644/Comptools/releases/latest',
  },
  {
    name: 'Killswitch',
    desc: 'Instant game termination utility. One global panic hotkey closes 30+ auto-detected games from the system tray, with an optional passcode-locked stealth screen.',
    lang: 'JavaScript',
    tags: ['tools'],
    url: 'https://github.com/jjtjtyt6644/killswitch',
  },
  {
    name: 'Web-Proxy',
    desc: 'Ambient, a web-based proxy built for all of your browsing needs, with games and apps pages, shortcuts and one-click Vercel deployment.',
    lang: 'HTML',
    tags: ['networking', 'web'],
    url: 'https://github.com/jjtjtyt6644/Web-Proxy',
  },
  {
    name: 'mcConfigUI',
    desc: 'A multi-tenant Minecraft hosting platform: a Next.js control panel on Vercel driving game servers on an Oracle Cloud Always Free ARM VM, with a live web terminal.',
    lang: 'JavaScript',
    tags: ['web', 'networking'],
    url: 'https://github.com/jjtjtyt6644/mcConfigUI',
  },
  {
    name: 'Spotify-tools',
    desc: 'A hybrid web and Electron app that transfers selected playlists and liked songs from one Spotify account to another, and shows stats for your account.',
    lang: 'JavaScript',
    tags: ['tools', 'web'],
    url: 'https://github.com/jjtjtyt6644/Spotify-tools',
  },
  {
    name: 'Medal-Tv-downloader',
    desc: 'A Python tool that bulk-downloads all your Medal.tv clips as .mp4s, named by date and title, skipping clips it already has. No external packages needed.',
    lang: 'Python',
    tags: ['tools'],
    url: 'https://github.com/jjtjtyt6644/Medal-Tv-downloader',
  },
  {
    name: 'Cookie-editor',
    desc: 'Cookie Editor Pro: a browser extension to view, create, edit, delete, search, import and export cookies, with Secure/HttpOnly/SameSite badges and a glassmorphism UI.',
    lang: 'JavaScript',
    tags: ['tools', 'security'],
    url: 'https://github.com/jjtjtyt6644/Cookie-editor',
  },
  {
    name: 'CyberAttacks-Simulation',
    desc: 'A real vulnerable website built to practice SQL injection, XSS, and other common attack vectors. Ships with a fully built-in SOC monitoring dashboard for real-time alerting and defense analysis.',
    lang: 'HTML',
    tags: ['security'],
    url: 'https://github.com/jjtjtyt6644/CyberAttacks-Simulation',
  },
  {
    name: 'FocusMode',
    desc: 'A Google Chrome extension that lets you block distracting websites, set deep-work timers, and enforce study sessions directly from the browser toolbar.',
    lang: 'JavaScript',
    tags: ['tools'],
    url: 'https://github.com/jjtjtyt6644/FocusMode',
  },
  {
    name: 'Ai-Vision',
    desc: 'An AI-powered Google Chrome extension that works like any other AI assistant but lives in your browser. Query images and page content with natural language with real-time AI analysis.',
    lang: 'JavaScript',
    tags: ['ai', 'tools'],
    url: 'https://github.com/jjtjtyt6644/Ai-Vison-',
  },
  {
    name: 'AutoQuest-Plugin',
    desc: 'A Vencord plugin that completes multiple Discord quests in the background simultaneously. Built using TypeScript by extending the Vencord modding framework.',
    lang: 'TypeScript',
    tags: ['tools'],
    url: 'https://github.com/jjtjtyt6644/AutoQuest-Plugin',
  },
  {
    name: 'Autoquest-Installer',
    desc: 'A fully automated installer that injects the AutoQuest plugin into Discord by modifying Vencord files. One-click setup experience built with CSS and shell scripting.',
    lang: 'CSS',
    tags: ['tools'],
    url: 'https://github.com/jjtjtyt6644/Autoquest-Installer',
  },
  {
    name: 'Aetheris',
    desc: 'A distraction-free, aesthetically driven productivity workspace for students and creators. Full TypeScript app with ambient modes, task tracking, and focus sessions.',
    lang: 'TypeScript',
    tags: ['tools', 'web'],
    url: 'https://github.com/jjtjtyt6644/Aetheris',
  },
  {
    name: 'Itinfinder-Website',
    desc: 'ItinFinder is an ultra-modern, premium cross-platform React Native (Expo) travel application. It utilizes cutting-edge AI (Groq + OpenRouter) and live web scraping agents (TinyFish) to craft ultra-specific, vivid, and culturally immersive travel itineraries — with robust offline support, background intelligence, and a Pro cloud tier.',
    lang: 'HTML',
    tags: ['web', 'tools'],
    url: 'https://github.com/jjtjtyt6644/Itinfinder-Website',
  },
  {
    name: 'Voting-web',
    desc: 'A full-featured web voting platform with real-time vote tracking, candidate profiles, and a clean administrative dashboard for managing polls.',
    lang: 'HTML',
    tags: ['web'],
    url: 'https://github.com/jjtjtyt6644/Voting-web',
  },
  {
    name: 'Studify',
    desc: 'A productivity-first study platform for students. Features timer-based sessions, note-taking, and progress analytics in a clean minimalist interface.',
    lang: 'TypeScript',
    tags: ['web', 'tools'],
    url: 'https://github.com/jjtjtyt6644/Studify',
  },
  {
    name: 'tution',
    desc: 'A TypeScript-based tuition management platform. Handles scheduling, student profiles, and session tracking for private tutors and educational centres.',
    lang: 'TypeScript',
    tags: ['web'],
    url: 'https://github.com/jjtjtyt6644/tution',
  },
  {
    name: 'Portfolio',
    desc: 'This portfolio website itself — built with Vite, GSAP, and Lenis. Featuring cinematic scroll animations, an AI mascot, interactive terminal, and a custom cursor.',
    lang: 'JavaScript',
    tags: ['web'],
    url: 'https://github.com/jjtjtyt6644/Portfolio',
  },
]
