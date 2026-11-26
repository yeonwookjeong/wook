# 원고 페이지 만들기: python3 -I build_page.py 폴더 "홈판제목" "검색제목" "태그" "스레드문안" "검수메모(HTML)" "페이지제목"
import sys,html,re
d,th,ts,tags,threads,notes,ptitle=sys.argv[1:8]
e=html.escape
body=open(f'{d}/body.txt',encoding='utf-8').read()
t=open(__file__.rsplit('/',1)[0]+'/page_template.html',encoding='utf-8').read()
t=re.sub(r'<title>.*?</title>',f'<title>{e(ptitle)}</title>',t,1)
t=re.sub(r'(<p id="th"[^>]*><b>).*?(</b>)',lambda m:m.group(1)+e(th)+m.group(2),t,1,re.S)
t=re.sub(r'(<p id="ts"[^>]*>).*?(</p>)',lambda m:m.group(1)+e(ts)+m.group(2),t,1,re.S)
t=re.sub(r'(<div id="b" class="txt">).*?(</div></div>)',lambda m:m.group(1)+e(body)+m.group(2),t,1,re.S)
t=re.sub(r'(<p id="tg"[^>]*>).*?(</p>)',lambda m:m.group(1)+e(tags)+m.group(2),t,1,re.S)
t=re.sub(r'(<p id="tr"[^>]*>).*?(</p>)',lambda m:m.group(1)+e(threads)+m.group(2),t,1,re.S)
t=re.sub(r'(<p class="label">5\. 검수·출처 \(블로그에 안 올림\)</p><p class="src">).*?(</p></div>)',lambda m:m.group(1)+notes+m.group(2),t,1,re.S)
open(f'{d}/page.html','w',encoding='utf-8').write(t); print('ok')
