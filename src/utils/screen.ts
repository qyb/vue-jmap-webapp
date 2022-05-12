// Cross-browser support as described in:
// https://stackoverflow.com/questions/1248081
function getClientWidth (): number {
  return Math.max(
    document.documentElement!.clientWidth,
    window.innerWidth
  )
}
function getClientHeight (): number {
  return Math.max(
    document.documentElement!.clientHeight,
    window.innerHeight
  )
}

/*
  <768, miniview, only msgcontent
  >=768, compactview, no folder
  >=920, normalview, compact folder/msglist
  >=1000, fullview
 */

const MINI_STATE = 0
const COMPACT_STATE = 1
const NORMAL_STATE = 2
const FULL_STATE = 3

const MIN_FULL = 1000
const MIN_NORMAL = 920
const MIN_COMPACT = 768

export {
  getClientWidth, getClientHeight,
  MINI_STATE, COMPACT_STATE, NORMAL_STATE, FULL_STATE,
  MIN_FULL, MIN_NORMAL, MIN_COMPACT,
}
