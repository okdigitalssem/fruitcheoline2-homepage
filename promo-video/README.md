# 과일철이네2 15초 세로형 홍보 영상

[HyperFrames](https://github.com/heygen-com/hyperframes)(HTML → 영상 변환 도구)로 만든
**15초 세로형(1080×1920, 30fps) 홍보 영상**입니다.
인스타그램 릴스, 유튜브 쇼츠, 카카오톡 채널, 틱톡 등에 그대로 올릴 수 있습니다.

- 완성된 영상: `fruitcheoline2-promo-15s.mp4` (배경음악·효과음 포함)

## 장면 구성

| 시간 | 장면 |
| --- | --- |
| 0.0 ~ 2.8초 | "마트 과일, 맛이 매번 복불복이셨죠?" (검정 배경) |
| 2.8 ~ 5.6초 | "그럼 과일철이네2!" + 딸기 사진 + "오늘도 과일철이네" 도장 (노랑 배경) |
| 5.6 ~ 10.0초 | POINT 01 신선도 최우선 / 02 당도 꼼꼼 체크 / 03 정성 가득 포장 |
| 10.0 ~ 12.6초 | 제철 과일 20종 한눈에 보기 + 선물용 과일세트 |
| 12.6 ~ 15.0초 | 배달·영업시간·전화번호·카카오톡 상담 안내 (엔딩) |

## 배경음악

외부 음원을 쓰지 않고 `tools/make-bgm.py` 로 **직접 합성한 자체 제작 음악**이라
저작권 걱정 없이 어디에나 올릴 수 있습니다.

- 150 BPM 경쾌한 마림바 팝 — 장면이 바뀌는 순간(2.8초·5.6초·10초)이 박자에 딱 맞습니다
- 질문 장면(0~2.8초)은 궁금한 느낌의 작은 멜로디, "그럼 과일철이네2!"부터 신나는 본 음악
- 장면 전환 '휙', 과일 20종 등장 '뽁뽁', 도장·카카오 버튼 '반짝' 효과음 포함
- 음량은 SNS 권장 수준(-14 LUFS)에 맞췄습니다

> 인스타그램·틱톡의 인기 음악을 쓰고 싶으면 업로드할 때 앱에서 음악을 추가하고
> 원래 소리 음량을 0으로 낮추면 됩니다.

음악을 다시 만들려면 (이 폴더에서):

```bash
pip install numpy
python3 tools/make-bgm.py
ffmpeg -y -i assets/audio/bgm.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k assets/audio/bgm.m4a
```

## 폴더 구성

```
promo-video/
├── index.html                   ← 영상 내용 (문구·순서·움직임)
├── fruitcheoline2-promo-15s.mp4 ← 완성된 영상
├── tools/make-bgm.py            ← 배경음악 만드는 스크립트
└── assets/
    ├── audio/bgm.m4a            ← 배경음악
    ├── fruits/                  ← 영상용 과일 사진 20장 (홈페이지 사진을 줄인 것)
    ├── fonts/                   ← 한글 글꼴 (영상에 쓰인 글자만 담은 가벼운 버전)
    └── gsap.min.js              ← 애니메이션 라이브러리
```

## 문구를 바꾸고 다시 만들기

1. `index.html` 에서 바꾸고 싶은 글자를 찾아 고칩니다. (예: 전화번호, 영업시간)
2. 컴퓨터에 [Node.js](https://nodejs.org) 22 이상과 [FFmpeg](https://ffmpeg.org)가 있어야 합니다.
3. 이 폴더(`promo-video`)에서 아래 명령을 실행합니다.

```bash
npx hyperframes@0.8.71 preview                                   # 브라우저에서 미리보기
npx hyperframes@0.8.71 render . -o fruitcheoline2-promo-15s.mp4 -q high  # MP4로 만들기
```

> ⚠ 글꼴은 영상에 쓰인 글자만 들어 있어서, **새로운 글자**를 넣으면 그 글자만 다른 글꼴로
> 보일 수 있습니다. 그럴 땐 `fonttools`의 `pyftsubset` 으로 글꼴을 다시 만들어 주세요.
> (원본 글꼴: Google Fonts의 Black Han Sans, Noto Sans KR — 둘 다 무료 OFL 라이선스)

> 과일 사진을 바꾸려면 `assets/fruits/` 안의 같은 이름 파일을 교체하면 됩니다.
