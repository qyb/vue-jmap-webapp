const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export function fuzzyDatetime (now: number, arg: Date): string {
  const delta = Math.round((now - arg.getTime()) / 1000)
  const minute = 60, hour = minute * 60, day = hour * 24, week = day * 7
  let fuzzy: string

  if (delta < 30) {
    fuzzy = 'just then.'
  } else if (delta < minute) {
    fuzzy = delta + ' seconds ago.'
  } else if (delta < 2 * minute) {
    fuzzy = 'a minute ago.'
  } else if (delta < hour) {
    fuzzy = Math.floor(delta / minute) + ' minutes ago.'
  } else if (Math.floor(delta / hour) == 1) {
    fuzzy = '1 hour ago.'
  } else if (delta < day) {
    fuzzy = Math.floor(delta / hour) + ' hours ago.'
  } else if (delta < day * 2) {
    fuzzy = 'yesterday'
  } else if (delta < day * 5) {
    fuzzy = weekday[arg.getDay()]
  } else {
    fuzzy = `${arg.getFullYear()}-${arg.getMonth()}-${arg.getDate()}`
  }
  return fuzzy
}

export function downloadFName(original: string): string {
  return original.replaceAll('/', '-').replaceAll('\\', '-')
}
