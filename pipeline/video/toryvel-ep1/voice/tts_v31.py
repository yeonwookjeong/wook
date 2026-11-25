import json,subprocess,base64,sys,os
# 대본 v3.1 + 줄별 속도 + 쉼표/일시정지 마크업
L=[("도쿄의 상징, 도쿄타워. [pause short] 그 꼭대기는, 원래 전차였습니다.",1.02),
("1950년대, 일본은 333미터 탑을 세우려 합니다.",1.1),
("문제는 철이었습니다. [pause short] 전쟁에 진 일본엔, 쓸 만한 철이 모자랐거든요.",1.1),
("그때 한 민간업자가, 고철을 낙찰받습니다.",1.08),
("한국전쟁이 끝나고 고철이 된 미군 전차, [pause short] 약 90대였죠.",1.08),
("전차로 탑을 짓는다고요?",1.0),
("전차 철갑은, 질 좋은 특수강이거든요.",1.1),
("녹이고 펴서 철골로 만든 뒤, 탑의 윗부분으로 올렸습니다.",1.1),
("그런데, [pause short] 반전은 따로 있습니다.",0.98),
("이 이야기는 공식 기록이 아니라, 전차를 해체한 업자 쪽에서 나온 증언입니다.",1.08),
("그래서 책마다, 들어간 높이도 조금씩 다르게 적혀 있죠.",1.1),
("그래서 지금도, 이렇게 말합니다.",1.02),
("도쿄 야경 꼭대기엔, [pause short] 한국전쟁을 지나온 전차가 서 있다고.",1.0)]
voice=sys.argv[1];out=sys.argv[2];os.makedirs(out,exist_ok=True)
for i,(t,rate) in enumerate(L,1):
    for mode in ("markup","text"):
        tt=t if mode=="markup" else t.replace(" [pause short]","")
        body={"input":{mode:tt},"voice":{"languageCode":"ko-KR","name":f"ko-KR-Chirp3-HD-{voice}"},"audioConfig":{"audioEncoding":"LINEAR16","sampleRateHertz":48000,"speakingRate":rate}}
        json.dump(body,open("req.json","w"),ensure_ascii=False)
        o=subprocess.run(["curl","-sS","-H","Content-Type: application/json; charset=utf-8","-d","@req.json","https://texttospeech.googleapis.com/v1/text:synthesize"],capture_output=True,text=True).stdout
        r=json.loads(o)
        if "audioContent" in r:
            open(f"{out}/l{i:02d}.wav","wb").write(base64.b64decode(r["audioContent"]))
            if i==1: print(voice,"mode",mode)
            break
        elif mode=="text": sys.exit(f"{voice} {i} fail {o[:200]}")
