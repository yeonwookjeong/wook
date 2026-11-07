import json,subprocess,base64,sys
lines=["도쿄의 상징, 도쿄타워. 그 꼭대기에는 한국전쟁이 녹아 있습니다.",
"1950년, 한반도에서 전쟁이 터지자 일본엔 미군 주문이 쏟아졌습니다.",
"전쟁이 끝나고 남은 건 부서진 미군 전차들.",
"마침 일본은 333미터 탑을 세우는데 철이 모자랐죠.",
"그래서 그 전차를 녹였습니다.",
"그 철이 들어간 곳이 탑의 윗부분, 3분의 1.",
"한반도에서 싸우던 전차가 지금은 도쿄 야경 꼭대기에 서 있는 셈입니다.",
"다음에 도쿄타워를 보면 꼭대기를 한번 올려다보세요."]
for i,t in enumerate(lines,1):
    body={"input":{"text":t},"voice":{"languageCode":"ko-KR","name":"ko-KR-Chirp3-HD-Sadaltager"},"audioConfig":{"audioEncoding":"MP3","speakingRate":1.11}}
    json.dump(body,open("req.json","w"),ensure_ascii=False)
    out=subprocess.run(["curl","-sS","-H","Content-Type: application/json; charset=utf-8","-d","@req.json","https://texttospeech.googleapis.com/v1/text:synthesize"],capture_output=True,text=True).stdout
    r=json.loads(out)
    if "audioContent" not in r: sys.exit(f"line {i} failed: {out[:300]}")
    open(f"l{i}.mp3","wb").write(base64.b64decode(r["audioContent"]))
