import { MENTOR } from '../config'

export default function MentorCard() {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-indigo-100 font-display text-lg font-bold text-indigo-700">
          {MENTOR.initials}
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">{MENTOR.name}</h2>
          <p className="text-sm text-stone-500">{MENTOR.role}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-stone-600">{MENTOR.bio}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Skills">
        {MENTOR.skills.map((skill) => (
          <li key={skill} className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600">
            {skill}
          </li>
        ))}
      </ul>
    </section>
  )
}
