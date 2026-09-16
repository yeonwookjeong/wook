# 여행 메모

네이버 블로그 롱폼의 원재료다. 여기에 메모를 남기고 초안을 만든다.

```bash
cp notes/TEMPLATE.md notes/2026-09-14-강릉.md
# 메모를 채운 뒤
npm run pipe -- draft --channel naver --notes notes/2026-09-14-강릉.md
```

초안은 `content/naver/` 에 생성된다. 메모에 없는 장소·가격·시간은 채워지지 않으므로,
숫자가 필요하면 메모에 먼저 적어둔다.
