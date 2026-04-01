# Junyu Portfolio

A high-performance, cinematic cybersecurity and networking portfolio featuring interactive AI components and advanced scroll-driven animations.

## Overview

This project is a professional showcase of cybersecurity expertise, networking projects, and research. It utilizes a modern tech stack to deliver a high-end user experience with smooth interactions and context-aware AI dialogue.

## Core Technologies

- Frontend: HTML5, Vanilla CSS3, ES6+ JavaScript
- Build Tool: Vite
- Animation: GSAP (ScrollTrigger, Flip)
- Smooth Scroll: Lenis
- AI Integration: Groq API (Llama 3 8B model)

## Key Features

- AI Mascot Guide: A dynamic, context-aware mascot that identifies the current section in the viewport and provides real-time professional insights using the Groq AI API.
- Sticky-Stacking Cards: A premium About section layout where discipline cards (Security, Networking, Development) stack sequentially during the scroll.
- Project Showcase: A horizontal-scrolling builds section with detailed project cards and deep-linked GitHub repositories.
- Cinematic UI: Uses glassmorphism, responsive typography, and heavy background blurs for a focused, high-end aesthetic.
- Global Search & Modals: Integrated modal system for project exploration without leaving the main page context.

## Featured Projects

- CyberAttacks-Simulation: A controlled environment for practiced threat detection and real-time SOC monitoring.
- FocusMode: A productivity-focused Chrome extension designed for deep-work sessions.
- Ai-Vision: An AI assistant that provides real-time visual analysis of browser tabs.
- Proxy: A lightweight HTTP proxy server engineered for traffic routing and security interception.

## Setup and Installation

1. Install dependencies:
   npm install

2. Configure environment variables:
   Create a .env file in the root directory and add your Groq API key:
   VITE_GROQ_API_KEY=your_api_key_here

3. Start development server:
   npm run dev

4. Build for production:
   npm run build

## Technical Details

The portfolio uses an intersection-based section tracking system that shoots a ray-cast to the center of the viewport to determine precisely which content the user is focused on. This data is then formatted and passed to the Groq LLM to generate professional, context-specific commentary.

## Contact

- Email: yaoprox0@gmail.com
- GitHub: https://github.com/jjtjtyt6644
