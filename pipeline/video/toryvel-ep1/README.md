# 토리블 1편 도쿄타워 · 편집 시안 (애니매틱)

- `tts.py`: 대사 8줄을 Sadaltager 1.11배로 녹음 (키는 환경 네트워크 시크릿으로 주입)
- `depth.py`: 실사 사진 깊이맵 (Depth Anything V2 Small ONNX)
- `scene.html` + `render.cjs`: 32초 타임라인. 실사 2.5D(인트로·6번 줄 강조) + 플로우 클립 자리 + 자막·카드
- 실사 사진: Wikimedia Commons "Tokyo tower at night 2024.jpg", Immanuelle, CC BY 4.0 → 캡션에 출처 표기
- 플로우 클립(A, T0, T2, T1, T3, B)이 오면 회색 자리에 프레임으로 교체
- 자막·카드 디자인은 임시 (미정)
