// Physical desk layout of the study space.
// 0 = empty cell (no desk). Read row by row, top to bottom.
// Desks are numbered: 1-78, 84-91, 92-98 (total: 93 desks)

export const DESK_LAYOUT = [
  //  c1   c2   c3   c4   c5   c6   c7   c8   c9  c10  c11
  [  9,  18,  27,  36,  45,  54,   0,   0,   0,   0,   0],  // row 1
  [  8,  17,  26,  35,  44,  53,  62,  70,  78,  91,   0],  // row 2
  [  7,  16,  25,  34,  43,  52,  61,  69,  77,  90,  98],  // row 3
  [  6,  15,  24,  33,  42,  51,  60,  68,  76,  89,  97],  // row 4
  [  5,  14,  23,  32,  41,  50,  59,  67,  75,  88,  96],  // row 5
  [  4,  13,  22,  31,  40,  49,  58,  66,  74,  87,  95],  // row 6
  [  3,  12,  21,  30,  39,  48,  57,  65,  73,  86,  94],  // row 7
  [  2,  11,  20,  29,  38,  47,  56,  64,  72,  85,  93],  // row 8
  [  1,  10,  19,  28,  37,  46,  55,  63,  71,  84,  92],  // row 9 — 71, 84, 92 aligned
]

// Flat list of valid desk numbers (no zeros)
export const VALID_DESKS = DESK_LAYOUT.flat().filter(n => n > 0)
export const VALID_DESK_SET = new Set(VALID_DESKS)
export const DESK_COUNT = VALID_DESKS.length  // 93
