# 네이버 모바일 검색 스니펫 추출: python3 -I nq.py "검색어" where 정규식 [개수]
import sys,re,html,urllib.parse,urllib.request
q,where,pat=sys.argv[1:4]; n=int(sys.argv[4]) if len(sys.argv)>4 else 8
url=f"https://m.search.naver.com/search.naver?where={where}&sort=1&query={urllib.parse.quote(q)}"
try:
    t=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (iPhone)'}),timeout=20).read().decode('utf-8','ignore')
except Exception as e:
    sys.exit(f"ERR {e}")
t=re.sub(r'<script.*?</script>|<style.*?</style>','',t,flags=re.S)
s=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',t)))
for i,m in enumerate(re.finditer(r'.{0,160}(%s).{0,260}'%pat,s)):
    if i>=n: break
    print('-',m.group(0))
