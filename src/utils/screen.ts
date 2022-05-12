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

export {
  getClientWidth,
  getClientHeight,
}
