# 개발·배포 가이드 (보훈 교재)

## 1. 라이브 테스트 주소 (GitHub Pages)
저장소: https://github.com/hanlzgi/design

GitHub 저장소 → Settings → Pages → Build and deployment
- Source: Deploy from a branch
- Branch: main / 폴더 /(root) → Save

1~2분 뒤 라이브 주소가 생성됩니다: https://hanlzgi.github.io/design/

index.html이 저장소 루트에 있으므로 별도 설정 없이 그대로 구동됩니다.
로컬에서 start.bat을 켤 필요 없이 이 주소에서 실제 웹 환경으로 점검할 수 있습니다.

## 2. 파이프라인 ↔ GitHub 연결 (1회 설정)
1. GitHub Desktop 설치 후 hanlzgi 계정으로 로그인.
2. File → Clone repository → hanlzgi/design → 저장 위치는 한글/괄호 없는 짧은 경로 권장 (예: C:\dev\design).
3. 이 클론 폴더를 Cowork 작업 폴더로 지정(폴더 선택). 이후 모든 편집이 곧 저장소 작업본에 반영됩니다.
4. (최초 1회) 클론이 최신이 아니면, 현재 작업 폴더의 파일을 클론 폴더에 덮어쓴 뒤 커밋/푸시해 저장소를 최신으로 맞춥니다.

## 3. 작업 흐름 (매 변경 시)
1. Claude가 작업 폴더의 파일을 수정.
2. GitHub Desktop에 변경 목록이 뜸 → 요약 메시지 입력 → Commit to main.
3. Push origin 클릭.
4. 1분 뒤 https://hanlzgi.github.io/design/ 새로고침(Ctrl+Shift+R)으로 실제 구동 확인.

기존 파이프라인(.ai 디자인 → 웹 자산 추출 → HTML/CSS/JS 편집)은 그대로 유지됩니다.
달라지는 점은 검증을 로컬 서버가 아닌 실제 웹(Pages)에서 한다는 것뿐입니다.

## 4. 배포 시 주의(웹 함정)
- 대소문자 일치: GitHub Pages(리눅스)는 경로 대소문자를 구분. 파일명/코드 경로 대소문자 정확히 일치(현재 불일치 0건).
- .nojekyll: 저장소 루트에 포함 → 한글 파일명/_ 파일을 그대로 서빙.
- 외부 라이브러리(CDN): Quill/html2pdf/html2canvas/Pretendard는 jsDelivr CDN 로드 → 인터넷 필요. 오프라인 배포 필요 시 assets/vendor/ 로컬화 예정.
- 미완 항목: 좌측 레일 "전체 PDF 다운로드"가 가리키는 content/download.pdf는 placeholder(추후). 탐방노트 PDF 출력과는 별개로 정상.

## 5. 로컬에서 빠르게 보고 싶을 때
폴더에서 start.bat 실행 → http://localhost:8000 (오프라인 점검용)
