import math,subprocess,sys,time
from PIL import Image
lat,lon=35.6586,139.7454
z=int(sys.argv[2]) if len(sys.argv)>2 else 17
n=2**z;fx=(lon+180)/360*n;fy=(1-math.log(math.tan(math.radians(lat))+1/math.cos(math.radians(lat)))/math.pi)/2*n
cols,rows=5,8
x0=int(fx)-cols//2;y0=int(fy)-rows//2
layer=sys.argv[1];ext='jpg' if layer in('seamlessphoto','gazo1','gazo2','gazo3','gazo4') else 'png'
im=Image.new('RGB',(cols*256,rows*256))
for i in range(cols):
  for j in range(rows):
    f=f"tiles/{layer}_{z}_{x0+i}_{y0+j}.{ext}"
    subprocess.run(["mkdir","-p","tiles"]);r=subprocess.run(["curl","-sS","-m","20","-o",f,"-w","%{http_code}",f"https://cyberjapandata.gsi.go.jp/xyz/{layer}/{z}/{x0+i}/{y0+j}.{ext}"],capture_output=True,text=True)
    if r.stdout=="200":
      try: im.paste(Image.open(f).convert('RGB'),(i*256,j*256))
      except Exception as e: print('bad',f)
# crop 9:16 centered on tower pixel
px=(fx-x0)*256;py=(fy-y0)*256;W=cols*256;H=int(W*16/9)
H=min(H,rows*256);W=int(H*9/16)
l=int(px-W/2);t=int(py-H/2);l=max(0,min(l,cols*256-W));t=max(0,min(t,rows*256-H))
im.crop((l,t,l+W,t+H)).save(f"{layer}_z{z}.jpg",quality=92)
print(layer,"tower px in crop",px-l,py-t,W,H)
