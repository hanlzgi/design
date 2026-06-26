#!/usr/bin/env python3
# photos/ 폴더 스캔 -> content/photos.json (이미지 매니페스트)
# 규칙: NNN / NNN-K = 페이지 표시 이미지, NNN_KK = 클릭 팝업 갤러리
import os, re, json
HERE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PH=os.path.join(HERE,'photos')
pat=re.compile(r'^(\d{3})(?:-(\d+))?(?:_(\d+))?\.(jpe?g|png)$', re.IGNORECASE)
pages={}
for f in sorted(os.listdir(PH)):
    m=pat.match(f)
    if not m: continue
    num,dash,under,_=m.groups()
    p=pages.setdefault(num,{'display':[],'gallery':[]})
    (p['gallery'] if under is not None else p['display']).append(((int(under) if under is not None else (int(dash) if dash else 0)), f))
out={n:{'display':[f for _,f in sorted(p['display'])],'gallery':[f for _,f in sorted(p['gallery'])]} for n,p in pages.items()}
open(os.path.join(HERE,'content','photos.json'),'w',encoding='utf-8').write(json.dumps(out,ensure_ascii=False,indent=2))
print("photos.json:", json.dumps(out,ensure_ascii=False))
