export const TIME_SLOTS = {
  full_day:          { label: '7am – 10pm (Full Day, 15 hrs)',          short: 'Full Day',  start: 7,  end: 22, hours: 15 },
  morning:           { label: '7am – 12pm (Morning, 5 hrs)',             short: 'Morning',   start: 7,  end: 12, hours: 5  },
  afternoon_evening: { label: '12pm – 10pm (Afternoon+Evening, 10 hrs)', short: 'Aft+Eve',   start: 12, end: 22, hours: 10 },
  day:               { label: '7am – 5pm (Day, 10 hrs)',                 short: 'Day',       start: 7,  end: 17, hours: 10 },
  evening:           { label: '5pm – 10pm (Evening, 5 hrs)',             short: 'Evening',   start: 17, end: 22, hours: 5  },
  afternoon:         { label: '12pm – 5pm (Afternoon, 5 hrs)',           short: 'Afternoon', start: 12, end: 17, hours: 5  },
  late_evening:      { label: '2pm – 10pm (Late Evening, 8 hrs)',        short: 'Late Eve',  start: 14, end: 22, hours: 8  },
}

// Returns true if two time slots overlap
export function slotsOverlap(slotA, slotB) {
  const a = TIME_SLOTS[slotA]
  const b = TIME_SLOTS[slotB]
  if (!a || !b) return false
  // Overlap if a.start < b.end AND b.start < a.end
  return a.start < b.end && b.start < a.end
}

export const SLOT_COLORS = {
  full_day:          'bg-purple-100 text-purple-800 border-purple-300',
  morning:           'bg-yellow-100 text-yellow-800 border-yellow-300',
  afternoon_evening: 'bg-orange-100 text-orange-800 border-orange-300',
  day:               'bg-blue-100 text-blue-800 border-blue-300',
  evening:           'bg-indigo-100 text-indigo-800 border-indigo-300',
  afternoon:         'bg-green-100 text-green-800 border-green-300',
  late_evening:      'bg-rose-100 text-rose-800 border-rose-300',
}
