# 보훈 교재 — 작업 인수인계 (HANDOFF)

> 최종 업데이트: 2026-07-06 · 코스 1(1챕터) 완료 · 코스 2~4는 다음 작업
> 새 대화에서 이 파일을 먼저 읽고 이어서 작업하세요.

## 1. 프로젝트 개요
- 국가보훈부 **국외 보훈 탐방 교재** — 웹 기반 인터랙티브 교재(전자책).
- **16:9 가로 전용**, PC 우선 + 모바일 고려. 크로스브라우저.
- 순수 **바닐라 JS SPA**(빌드 없음). 로컬 서버로 실행: 폴더의 `start.bat` (python -m http.server → localhost:8000).
- 작업 폴더 = **git 저장소** `D:\BK\github\design` (github.com/hanlzgi/design). 커밋/푸시는 사용자가 GitHub Desktop으로.

## 2. 구조 / 핵심 파일
- `index.html` — stageWrap > stage(1920x1080, scale로 화면맞춤) + chrome(좌측 레일/로고/상단아이콘) + pager.
- `assets/js/app.js` — 전체 로직(IIFE). sitemap 라우팅, 페이지 렌더, 인터랙션.
- `assets/css/app.css` — 전 스타일. (프레임/배지/타이틀/노트/퀴즈/지도/전환 등)
- `content/sitemap.json` — **78 페이지** 라우팅·레이아웃 데이터(페이지별 textBlocks/buttons/photoSlots/rect 등). 진본.
- `content/text/0NN.json` — 페이지별 텍스트 문안(번호=페이지). 예: 006=읽기1.
- `content/01_title.js` (window.TEXTBOOK_CONTENT) — 표지/목차 카드 데이터.
- `content/photos.json` — 사진 매핑. `photos/` — 사진 원본(**사용자 통제, 절대 수정 금지**).
- `assets/c1/...` — 코스1 자료(quiz svg, map svg 등). `assets/icons/` — 아이콘.
- `_archive_unused/` — 미사용 파일 보관(삭제 아님).

## 3. 좌표계 (중요)
- 스테이지 = **1920 x 1080**. 모든 위치값은 이 좌표계.
- **Figma 파일도 동일 1920x1080 스케일** → Figma px값을 그대로 사용(환산 불필요). (frm-panel: left155,top15,1750x1050 등 Figma와 일치)

## 4. 페이지 타입 & 렌더 (render() 분기, app.js)
모두 CSS 프레임(스켈레톤 이미지 아님):
- **cover(표지)**: framed + cover-img(전체 일러스트 round-box) + 좌측 크롬만(상단 아이콘 hide-top).
- **toc(목차)**: framed + frm-panel + 카드(01_title.js). 카드 문안(region/title)은 title_w 폭으로 **중앙정렬**.
- **map(지도)**: framed + frm-panel + map-svg(assets/c1/map/c1-map.svg) + map-badge/map-title + mapHotspots(도시 점). 클릭시 딤+카드 팝업(map-card 이미지) + **X 닫기 버튼**(74px 회색원+진한 ×, 카드 우상단 코너, 딤클릭도 닫힘).
- **prestudy/intro/reading**: renderFrame() → frm-panel(그라데이션) + frm-body(흰 콘텐츠 카드) + frm-badge(흰 알약) + renderTextBlocks(sitemap textBlocks). **돋보기(frm-search) 삭제됨**.
- **quiz**: framed + frm-panel + questionPanel(assets/c1/quiz/quizN.svg 문제배너) + 보기(CSS)+사진. 정답=딤 + answerPanel(ansN.svg) + answerLayout 텍스트(question/label/explanation) 오버레이.
- **note(탐방노트)**: framed + frm-panel + 타이틀 + 에디터카드(Quill: bold/italic/underline/list/image/link/eraser + 전체지우기 + PDF출력) + 스크랩카드(헤더 + 회색 바디 scrap-body). 두 카드 **맞붙여 연속 흰색**(마주보는 모서리 직각, 셰브론 제거됨). IndexedDB(NDB='bohun_note') 저장. 스크랩 캡처 html2canvas(scale 1.2, maxW 1400, jpeg 0.9) + **SVG는 PNG 래스터화**(onclone)로 지도 등 캡처. 드래그앤드롭 스크랩→에디터.

## 5. Figma 리디자인 (최종 적용값)
- **그라데이션**(.frm-panel): `linear-gradient(180deg,#737de4 0%,#5f68d4 45%,#464db6 100%)`, radius 44.
- **배지**(reading/intro/prestudy 공통): 흰 알약 `.frm-badge {left247,top156,w195,h56,radius39,bg#fff}` + 라벤더 원+흰 깃발(.frm-flag, FLAG_SVG) + 네이비 텍스트. **배지 문구는 번호 유지**("읽기 자료①" 등). 배지 텍스트 블록(sitemap): `x299,y166,w140,align center`(원 오른쪽~알약끝 영역 중앙).
- **타이틀**: 흰 타이틀바 제거 → **흰색 텍스트(58px)를 그라데이션 위 직접**. 텍스트 블록: color#fff,size58,x250,y238,w1560.
- **gmap 마커**: 배지 오른쪽 `{x451,y156,w55,h55}`, .btn-gmap = 흰 원 + gmap-marker.png(64%). (전 읽기 페이지 공통)

## 6. 인터랙션 기능
- 페이지 이동: pager, **방향키 ←/→**(입력/에디터 포커스시 무시), **마우스 휠**(650ms 쿨다운, 노트/스크롤영역 제외), **모바일 코너 탭존**(.nav-zone 좌하단/우하단, z-index2라 버튼 우선).
- **페이지 전환 모션**: 슬라이드(패널폭 1750px), stage에 `clip-path`(pg-sliding)로 frm-panel 창에 클리핑 → 좌측 UI 고정, 패널만 전환. prefers-reduced-motion 존중.
- 주석(annotation): content/text의 `annotations[].term`이 본문 첫 등장에 붙음.

## 7. 텍스트 블록 식별 (미세조정용)
- renderTextBlocks가 각 문안을 `.txt-block .txt-<id>` + `data-tid="<id>"`로 생성(예: txt-badge/txt-title/txt-s1/txt-caption). DevTools에서 구분 가능.
- **위치는 인라인 스타일(sitemap textBlocks 값)** → CSS로 못 덮음. 미세조정은 `content/sitemap.json`의 페이지별 `textBlocks[]`에서 id로 x/y/w/size/color/align 수정.

## 8. ⚠️ 워크플로 주의사항 (매우 중요)
- **D: 마운트 쓰기 불안정**: 파일이 잘리거나(NUL/truncation) 옛 버전으로 되돌아간 사고가 반복됨. 모든 쓰기는 **fsync + 별도 프로세스 재검증**(md5/파싱/중괄호). 실제로 app.css가 옛 사본 커밋으로 리디자인이 소실된 적 있음(스냅샷에서 복원).
- **커밋은 반드시 이 폴더(D:\BK\github\design)의 현재 파일 기준으로만.** 다른 곳(옛 사본·다른 폴더)의 파일을 이 폴더에 덮지 말 것.
- **photos/ 폴더는 사용자 통제, 절대 수정 금지.** 이미지/AR/지도 소스 교체도 사용자가.
- 웹 콘텐츠는 web_fetch/WebSearch만(curl 금지). git push는 사용자가(토큰 요청 금지).
- Figma 커넥터 연결됨(파일 yXzotdFfVTvG2So4JIkCsS, 에디터 권한). get_design_context/get_screenshot 사용 가능.

## 9. 무결성 기준(정상값)
- app.js `node --check` OK · app.css 중괄호 균형 · sitemap 75 pages(map-popup 3개 삭제 후)·NUL 0 · 깨진 assets 참조 0.

## 10. 다음 작업 (코스 2~4)
- 방식: 사용자가 **원고 PDF** 제공(정리 중, 대기) → 페이지별로 **코스1 레이아웃(타입) 선택** → sitemap에 페이지 추가 + content/text/0NN.json 채움.
- 현재 c2/c3/c4 페이지는 sitemap에 placeholder(id만) 존재.
- **map-popup 타입 페이지(c2/c3/c4-map-popup) 삭제 완료(2026-07-08)**: 코스1처럼 지도 팝업은 별도 페이지가 아니라 `map` 페이지 내 `mapHotspots`+`mapCardRect`로 구현. sitemap 78→75페이지. app.js의 typeLabel에서도 'map-popup' 항목 제거. 코스2~4 map 페이지에 실제 콘텐츠 채울 때 mapHotspots 배열 추가하면 됨(c1-map 구조 참고).
- 남은 미세조정: 배지/타이틀 좌표 픽셀 튜닝(요청시), 퀴즈/표지 Figma 대조, download.pdf 실제 파일 등.
## 11. 호환성/캐시 보완 (2026-07-09)
- **대상 환경**: Chrome > Safari > 삼성브라우저 우선. 기기 하한 = 갤럭시 S6(삼성브라우저가 구형 Chromium일 수 있어 폴백 적용).
- **캐시버스터 고정**: app.js `const V = '?v=20260709'` — 에셋(사진/SVG/아이콘) 교체 시 이 문자열을 수동으로 올릴 것. (Date.now() 제거 → 브라우저 캐시 활용)
- **CDN 제거 → 로컬 번들**: `assets/vendor/` (quill 1.3.7, html2canvas 1.4.1, html2pdf 0.10.1, Pretendard Variable woff2 1개). index.html은 로컬 경로만 참조. 오프라인/CDN 차단망 OK.
- **c1-map.svg 루트에 width/height 추가** — Safari/Firefox canvas drawImage(스크랩 캡처) 빈 렌더 방지. 코스2~4 지도 SVG 추가 시에도 **viewBox와 함께 width/height 필수**.
- **구형 Chromium 폴백**: aspect-ratio 미지원 시 JS(sizeWrap)로 stageWrap 크기 계산 · CSS `inset`→개별 top/right/bottom/left · flex `gap` 전부 마진(`> * + *`)으로 대체(신규 CSS에서 gap 사용 금지) · `-webkit-backdrop-filter` 병기 · 주요 버튼 `touch-action: manipulation`.
- **클립보드 폴백**: copyText()/legacyCopy() — http LAN 등 비보안 컨텍스트에서 execCommand 폴백, 실패 시 실패 토스트.
- **오버레이 열림 중 페이지 이동 차단**: overlayOpen() — 검색/갤러리/확대/퀴즈 정답·오답/지도 팝업 열려 있으면 휠·방향키 무시.
- **미해결(안내 필요)**: iPhone 전체화면 API 미지원(버튼 무반응) · iOS Safari 7일 미사용 시 IndexedDB 삭제 가능(탐방노트 유실 위험 안내 문구 고려) · NanumSquare는 참조만 있고 미로드(항상 Pretendard 폴백).
- **⚠ 쓰기 사고 재발(2026-07-09)**: 파일 도구(Edit/Write) 직접 쓰기에서 app.js/app.css/index.html이 이전 파일 크기로 잘리는 truncation 발생 → bash(python, fsync) 쓰기 + 별도 프로세스 재검증으로 복구. **이 폴더의 모든 쓰기는 bash+fsync+재검증으로 할 것.**
- **사용자 수동 수정(2026-07-09, 롤백 금지)**: app.css 88라인 `.f-sans-sb`에 `font-size: 40px !important;` 추가 · 01_title.js 문구 수정(커밋됨). 020.json은 GitHub 429 오류 텍스트로 덮인 사고가 있어 HEAD로 복원 — 문구 수정 재적용 필요.
## 12. 코스2 콘텐츠 적용 (2026-07-09)
- sitemap 22~38(c2) 17페이지 채움 — c1 대응 레이아웃 복제(22←4, 개론←5, 읽기←6/9/17, 퀴즈←18/19/20). 21(c2-map)은 placeholder 유지(지도 SVG 대기).
- content/text/022~038.json 신규 + photos.json 022~037 매핑(038 사진 없음). 원고=코스2 PDF(0614), 주석=주석 PDF(0707).
- 퀴즈: c1 quiz/ans SVG 재사용. qtext에 질문+지문 결합(size26, y210). 퀴즈3(038)은 사진 없이 보기 중앙(x650). photoCaption 지원 추가(renderQuiz + .quiz-photocap) — 037에 사용.
- 주석 중 '동양 평화'(026)·'순국'(027)은 본문에 용어 그대로 없어 인접 구절에 연결(term≠label). 검수 필요.
- 사용자 확인 대기: 퀴즈 SVG c1 재사용 여부, 022 VR 버튼 구성, 픽셀 미세조정.
## 13. 코스3 콘텐츠 적용 (2026-07-09)
- **⚠ 전체 페이지 수 75→76**: 원고가 읽기자료 11개 구조(사진 폴더도 일치)라 c3-read11 페이지 삽입. c3 = 39(map, placeholder)~57(quiz3). c4-map은 58, note는 76으로 밀림. §9의 '75 pages' 기준은 76으로 갱신.
- sitemap 40~57(c3) 18페이지 채움(레이아웃: c1 템플릿). content/text/040~057.json + photos.json 040~057.
- 페이지별 버튼: VR 6곳(42,45,46,49,50 + 사전학습 아님), AR 1곳(52), 나머지 추가자료 2~3개+구글맵. 40(사전학습)은 add 2개.
- 주석: 코스3 정의(주석 PDF) 적용. '인도주의'(052)는 본문 인접 구절에 연결(term≠label). 원고 p14의 후보 라인(신흥무관학교/군사훈련/3.1운동)은 c2 복붙 오류로 판단 — 048에는 '윌로우스 비행가양성소' 주석만 적용.
- 퀴즈 3개 모두 사진 있음(055~057). 해설이 문어체('-이다')로 c1·c2(존댓말)와 다름 — 원고 그대로 반영, 통일 여부는 사용자 결정.
## 14. 코스4 콘텐츠 적용 (2026-07-09)
- **⚠ 전체 페이지 수 76→75**: 코스4 원고는 읽기자료 9개 + 개론 묶음(3/2/4) 구조 → c4-read10 삭제, 개론 위치 재배열. c4 = 58(map, placeholder)~74(quiz3), note = 75. 최종 정상값: **75 pages** (c1 18 / c2 17+map / c3 18+map / c4 16+map / 공통 title·toc·note).
- sitemap 59~74 채움, content/text/059~074.json, photos.json 059~073 (074=quiz3 사진 없음 → 보기 중앙 x650, c2-quiz3 방식).
- 버튼: VR 5곳(사전학습59, 61, 65, 66 + …), AR 1곳(63, 만국평화회의). 59 사전학습 타이틀이 길어 title size 46으로 축소.
- 주석: 코스4 정의 전체 적용('국제사회'는 본문 표기에 맞춰 term 무공백, label '국제 사회').
- **원고 의심 사항**: 071(런던 참전기념비) 구글맵 링크가 c3 043(하와이 병영)과 동일(J2EvKzmmJjz7YqNdA) — 원고 그대로 반영했으나 확인 필요.
- 남은 것: c2/c3/c4 지도(map) 페이지 3개 — 지도 SVG + 팝업 카드 이미지 제공 시 mapHotspots 작업.

