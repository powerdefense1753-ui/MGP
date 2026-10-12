from pathlib import Path
import random
random.seed(4)
out=Path(__file__).resolve().parent / "art"
palettes={
'rome':('#e9bf84','#c67d4b','#8e7655','#e4bd83','#6c7c59'),
'jade':('#c2d6c6','#6b8d7b','#355b57','#d8c9a0','#385e51'),
'space':('#182b49','#7886a8','#364469','#d3b77d','#68828e'),
'forest':('#c5cfa4','#7a956b','#46684b','#c6ac75','#436648'),
'north':('#d5ded6','#8fa8ab','#526f7d','#dce0cb','#486777'),
'japan':('#eed8bd','#bd7a63','#805955','#dbb991','#925b50'),
'modern':('#aabbb3','#617f79','#2c504d','#9ea18b','#315951'),
'castle':('#ddc9a4','#aa9169','#6c7258','#d3bc8a','#657353')}
for name,(sky,mountain,deep,stone,tree) in palettes.items():
 parts=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="{sky}"/><stop offset="1" stop-color="{mountain}"/></linearGradient><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".09"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs><g filter="url(#noise)"><path fill="url(#sky)" d="M0 0h800v480H0z"/>']
 if name=='space':
  for i in range(100):
   x,y=random.randint(0,800),random.randint(0,480);parts.append(f'<circle cx="{x}" cy="{y}" r="{random.choice([.7,1,1.5])}" fill="#f4dfb2" opacity=".7"/>')
  parts+=['<circle cx="590" cy="177" r="113" fill="#b39587"/><path d="M491 127c70 25 135 19 200 0M482 158c72 25 153 28 218 3M490 196c56 24 123 30 198 7" fill="none" stroke="#726c7a" stroke-width="12" opacity=".4"/><ellipse cx="590" cy="182" rx="180" ry="35" transform="rotate(-28 590 182)" fill="none" stroke="#c4c3ad" stroke-width="9" opacity=".65"/>','<path d="m80 302 176-88 168 45-171 35-68 73z" fill="#bfc6bd"/><path d="m256 214-3 80 171-35z" fill="#667b81"/><path d="m80 302 105 65 68-73z" fill="#344f60"/><path d="m180 302 52-28-25 48z" fill="#d7a76c"/><path d="m127 330-99 34 113-13" fill="#7ad4cc" opacity=".7"/>']
 else:
  parts.append(f'<circle cx="605" cy="108" r="55" fill="#f8e4b3" opacity=".65"/>')
  parts.append(f'<path d="M0 260 105 117 202 231 334 108 467 240 612 147 800 229V480H0Z" fill="{mountain}" opacity=".55"/><path d="M0 310 157 220 303 288 457 188 610 257 800 182V480H0Z" fill="{deep}" opacity=".55"/><path d="M0 360 Q190 210 410 307T800 285V480H0Z" fill="{tree}"/>')
  if name=='north':parts.append('<path d="m105 117-36 70 34-21 28 22zm229-9-51 70 48-15 36 32zm123 80-32 39 27-10 38 23z" fill="#e9eadb"/>')
  if name in ['rome','jade','forest','north','japan']:
   parts.append(f'<path d="M575 268 Q390 317 463 366T198 480H430Q640 409 568 359T658 280Z" fill="{sky}" opacity=".62"/>')
  for x,y,s in [(95,310,.8),(190,271,.8),(285,299,1.1),(402,233,1),(510,297,.7),(665,290,.85)]:
   if name in ['jade','japan']:
    parts.append(f'<g transform="translate({x} {y}) scale({s})"><path d="M-44 8h88v58h-88z" fill="{stone}"/><path d="m-64 9 19-12 43-29L44-4 65 9z" fill="{deep}"/><path d="m-51-23 18-10 31-27 34 26 20 11z" fill="{deep}"/><path d="M-20 30h14v35h-14zm26 0h14v35H6z" fill="{deep}"/><path d="M-3-59v-20" stroke="{deep}" stroke-width="3"/></g>')
   elif name=='modern':
    h=random.randint(80,160);parts.append(f'<g transform="translate({x} {y})"><path d="M-35 60V-{h}h70V60" fill="{stone}"/><path d="M0 60V-{h}h35V60" fill="{deep}"/>')
    for wy in range(-h+15,45,20):parts.append(f'<path d="M-25 {wy}h15m16 0h15" stroke="{sky}" stroke-width="7"/>')
    parts.append('</g>')
   elif name=='castle':
    parts.append(f'<g transform="translate({x} {y}) scale({s})"><path d="M-35 65V-37h15v12h15v-12h15v12h15v-12h15V65z" fill="{stone}"/><path d="M1-25h39v90H1z" fill="{mountain}"/><path d="M-10 65V33a10 10 0 0 1 20 0v32" fill="{deep}"/><path d="M0-35v-42l33 8-33 10" stroke="{deep}" fill="#994d3b" stroke-width="2"/></g>')
   else:
    parts.append(f'<g transform="translate({x} {y}) scale({s})"><path d="M-40 5h80v57h-80z" fill="{stone}"/><path d="M0 5h40v57H0z" fill="{mountain}"/><path d="m-52 5 51-32L53 5z" fill="{deep if name in ["forest","north"] else "#a45f43"}"/><path d="M-23 26h12v36h-12zm25 0h12v36H2z" fill="{deep}"/></g>')
  if name=='rome':
   parts.append(f'<g transform="translate(380 326)"><path d="M-73 58h150v10H-73zM-63-14H67v10H-63z" fill="{stone}"/><path d="m-80-14 80-47 84 47z" fill="#eee0b2"/>')
   for x in [-55,-30,-5,20,45]:parts.append(f'<path d="M{x} -4h12v60h-12z" fill="#ebd8a9"/>')
   parts.append('</g>')
  for i in range(18):
   x=random.randint(0,800);y=random.randint(340,475);h=random.randint(25,85)
   if name=='japan':parts.append(f'<path d="M{x} {y}v-{h*.5}" stroke="{deep}" stroke-width="4"/><circle cx="{x}" cy="{y-h*.6}" r="{h*.3}" fill="#d6a69a"/>')
   else:parts.append(f'<path d="M{x} {y}v-{h}" stroke="{deep}" stroke-width="3"/><path d="m{x} {y-h} -{h*.2} {h*.8}q{h*.2} 14 {h*.4} 0Z" fill="{tree}"/>')
  parts.append(f'<path d="M0 457Q210 384 360 455t440-16v41H0Z" fill="{deep}" opacity=".5"/>')
 parts.append('</g></svg>');(out/(name+'.svg')).write_text(''.join(parts))
