export const layout = {
  // 모바일 앱을 넓은 화면에서 열면 내용이 좌우로 끝까지 늘어나 한 줄이 길어지고
  // 좌우 끝에 붙은 요소들의 간격이 벌어진다. 화면 폭과 무관하게 이 폭 안에 담는다.
  maxContentWidth: 720,
  // 대화 목록을 옆에 두는 화면은 사이드바만큼 더 필요하다.
  maxContentWidthWide: 1000,
  sidebarWidth: 236,
  // 이보다 좁으면 사이드바를 상시 노출하지 않고 토글로 연다.
  sidebarBreakpoint: 860,
} as const;
