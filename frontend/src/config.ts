// Where the API lives. Set VITE_API_URL in .env (see .env.example) or in Vercel's project settings.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

// The (fictional) mentor whose calendar this is. One host, as the challenge describes.
export const MENTOR = {
  name: 'Sam Rivera',
  initials: 'SR',
  role: 'Senior Full-Stack Engineer',
  bio: 'Nine years of shipping React and Node apps, and more code reviews than I can count. Bring me what you’re stuck on and we’ll get you moving again.',
  skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'System design'],
}
