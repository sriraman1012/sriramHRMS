// Weekly-off rules.
//   days : weekdays off EVERY week            e.g. [0]      (Sunday)
//   nth  : weekday -> occurrences that are off e.g. {6:[2,4]} (2nd & 4th Saturday)
// Occurrence of a date = which Nth weekday-of-month it is: day 1-7 -> 1, 8-14 -> 2, …

export function occurrenceOf(date) {
  return Math.floor((date.getDate() - 1) / 7) + 1 // 1..5
}

export function isWeeklyOff(date, cfg) {
  const dow = date.getDay()
  const days = (cfg && cfg.days) || []
  if (days.includes(dow)) return true
  const nth = (cfg && cfg.nth) || {}
  const list = nth[dow] || nth[String(dow)]
  if (list && list.length && list.includes(occurrenceOf(date))) return true
  return false
}
