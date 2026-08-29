# wook — 일본어 JLPT 학습 앱 (개인용)

Expo(React Native) 기반 JLPT N5 단어 학습 앱. SM-2 간격 반복(SRS) 알고리즘으로 복습 스케줄을 관리합니다.

## 실행 방법

```bash
npm install
npm run start
```

Expo Go 앱으로 QR코드를 스캔해서 실행하세요.

## 핵심 기능 (MVP)

- **홈**: 오늘의 신규 단어(하루 ~18개) + 복습 대기 단어 학습, 연속 학습일 표시
- **테스트**: 최근 학습 단어 퀴즈, 셔플 테스트, 오답노트 재학습
- **마이**: 완료한 Day, 연속 학습, 학습한 단어 수 통계
- **SM-2 SRS**: 단어별 interval / ease factor / repetitions를 관리해 복습 주기를 개인화

## 데이터 출처

`src/data/n5.json`은 [elzup/jlpt-word-list](https://github.com/elzup/jlpt-word-list) (MIT License)에서 가져온 JLPT N5 어휘 718개를 하루 18개씩 40일 분량으로 재구성한 것입니다. 뜻은 원본 데이터셋 그대로 영어로 되어 있습니다. 자세한 출처는 `src/data/ATTRIBUTION.md` 참고.

## 다음 단계 (후순위)

- 문장/상황별/채팅/손글씨/타이핑 학습 모드
- N4~N1 단어 데이터 추가
- 주간/월간 모의고사
- 단어 뜻 한국어 번역
- 앱스토어 배포용 빌드
