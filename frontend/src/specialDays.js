// Daily "special day" lookup (Windows-calendar style). Keyed by MM-DD.
// If a date has no notable day, a rotating highlight is shown instead.
const SPECIAL = {
  '01-01': { title: "New Year's Day", sub: 'A fresh start — new goals, new hopes.' },
  '01-15': { title: 'World Religion Day', sub: 'Respect and understanding for all faiths.' },
  '01-24': { title: 'International Day of Education', sub: 'Learning opens every door.' },
  '01-26': { title: 'Republic Day', sub: 'Celebrating the spirit of the nation.' },
  '02-04': { title: 'World Cancer Day', sub: 'Awareness, care and hope.' },
  '02-11': { title: 'Day of Women in Science', sub: 'Celebrating women in STEM.' },
  '02-14': { title: "Valentine's Day", sub: 'Share a little kindness and love.' },
  '02-20': { title: 'World Day of Social Justice', sub: 'Fairness and dignity for all.' },
  '02-21': { title: 'Mother Language Day', sub: 'Every language is worth preserving.' },
  '03-08': { title: "International Women's Day", sub: 'Celebrate progress and equality.' },
  '03-15': { title: 'World Consumer Rights Day', sub: 'Informed choices, fair markets.' },
  '03-20': { title: 'Day of Happiness', sub: 'Choose joy — it is contagious!' },
  '03-21': { title: 'World Poetry Day', sub: 'A few words can move the world.' },
  '03-22': { title: 'World Water Day', sub: 'Every drop counts.' },
  '04-01': { title: "April Fools' Day", sub: 'Keep it light and share a laugh!' },
  '04-07': { title: 'World Health Day', sub: 'Take a moment for your wellbeing.' },
  '04-22': { title: 'Earth Day', sub: 'Small actions, a greener planet.' },
  '04-23': { title: 'World Book Day', sub: 'Get lost in a good story.' },
  '05-01': { title: 'Labour Day', sub: 'Honouring the dignity of work.' },
  '05-03': { title: 'World Press Freedom Day', sub: 'A free press, a free society.' },
  '05-12': { title: "International Nurses Day", sub: 'Thank you to every caregiver.' },
  '05-31': { title: 'World No-Tobacco Day', sub: 'A healthier breath, a healthier you.' },
  '06-05': { title: 'World Environment Day', sub: 'Care for nature, it cares for us.' },
  '06-14': { title: 'World Blood Donor Day', sub: 'Give blood, give life.' },
  '06-21': { title: 'International Yoga Day', sub: 'Breathe, stretch, find your calm.' },
  '07-11': { title: 'World Population Day', sub: 'A shared planet, a shared future.' },
  '07-30': { title: 'International Day of Friendship', sub: 'Celebrate the bonds that unite us!' },
  '08-12': { title: 'International Youth Day', sub: 'The future is in good hands.' },
  '08-15': { title: 'Independence Day', sub: 'Celebrating freedom and unity.' },
  '08-19': { title: 'World Humanitarian Day', sub: 'Kindness knows no borders.' },
  '09-05': { title: "Teachers' Day", sub: 'Gratitude to those who guide us.' },
  '09-08': { title: 'International Literacy Day', sub: 'Reading empowers everyone.' },
  '09-21': { title: 'International Day of Peace', sub: 'Peace begins with each of us.' },
  '09-27': { title: 'World Tourism Day', sub: 'Explore, discover, connect.' },
  '10-01': { title: 'Day of Older Persons', sub: 'Wisdom deserves our respect.' },
  '10-02': { title: 'Day of Non-Violence', sub: 'Gandhi Jayanti — peace over force.' },
  '10-05': { title: "World Teachers' Day", sub: 'Shaping minds, shaping futures.' },
  '10-10': { title: 'World Mental Health Day', sub: 'Your wellbeing matters.' },
  '10-16': { title: 'World Food Day', sub: 'No one should go hungry.' },
  '11-14': { title: "Children's Day", sub: 'Every child deserves a bright future.' },
  '11-19': { title: 'World Toilet Day', sub: 'Sanitation and dignity for all.' },
  '11-21': { title: 'World Television Day', sub: 'Stories that inform and inspire.' },
  '12-01': { title: 'World AIDS Day', sub: 'Awareness, compassion, support.' },
  '12-03': { title: 'Day of Persons with Disabilities', sub: 'Inclusion for everyone.' },
  '12-10': { title: 'Human Rights Day', sub: 'Dignity and rights for all people.' },
  '12-25': { title: 'Christmas Day', sub: 'Peace, joy and goodwill to all.' },
  '12-31': { title: "New Year's Eve", sub: 'Look back with gratitude, ahead with hope.' },
}

// Shown on days with no specific event (rotates so it varies day to day).
const FALLBACK = [
  { title: "Today's Highlight", sub: 'Make today count — one step at a time.' },
  { title: 'Daily Focus', sub: 'Small efforts add up to big results.' },
  { title: 'Daily Celebration', sub: 'Find a reason to smile today!' },
  { title: 'Positive Vibes', sub: 'A good attitude changes everything.' },
  { title: 'Stay Motivated', sub: 'You are capable of amazing things.' },
  { title: 'Gratitude Day', sub: 'Count the good things around you.' },
  { title: 'Fresh Start', sub: 'Every day is a new opportunity.' },
]

export function getSpecialDay(date = new Date()) {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  if (SPECIAL[mmdd]) return { ...SPECIAL[mmdd], special: true }
  const start = new Date(date.getFullYear(), 0, 0)
  const doy = Math.floor((date - start) / 86400000)
  return { ...FALLBACK[doy % FALLBACK.length], special: false }
}

// The next `count` special days after `from` (searches forward up to a year).
export function getUpcoming(from = new Date(), count = 8) {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const res = []
  for (let i = 1; i <= 366 && res.length < count; i++) {
    const cur = new Date(base)
    cur.setDate(base.getDate() + i)
    const mmdd = `${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    if (SPECIAL[mmdd]) {
      res.push({
        ...SPECIAL[mmdd],
        mmdd,
        daysUntil: i,
        dateLabel: cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekday: cur.toLocaleDateString('en-US', { weekday: 'short' }),
      })
    }
  }
  return res
}
