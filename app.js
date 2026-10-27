const $=s=>document.querySelector(s);
const loginView=$("#loginView"),appView=$("#appView"),ddsInput=$("#ddsInput"),iconInput=$("#iconInput"),startIndex=$("#startIndex"),atlasCanvas=$("#atlasCanvas"),overlayCanvas=$("#overlayCanvas"),actx=atlasCanvas.getContext("2d",{willReadFrequently:true}),octx=overlayCanvas.getContext("2d"),exportBtn=$("#exportBtn");
let sourceDDS=null,icons=[];
let watermarkImage=null,watermarkUrl=null,watermarkCrop=null;

function setAuth(ok){loginView.classList.toggle("hidden",ok);appView.classList.toggle("hidden",!ok)}
async function checkSession(){try{const r=await fetch("/api/session",{credentials:"same-origin"});setAuth(r.ok)}catch{setAuth(false)}}
$("#loginBtn").onclick=async()=>{
  $("#loginError").textContent="";
  try{
    const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({username:$("#username").value,password:$("#password").value})});
    if(!r.ok){$("#loginError").textContent="Invalid username or password.";return}
    setAuth(true);
  }catch{$("#loginError").textContent="Login service unavailable."}
};
$("#password").addEventListener("keydown",e=>{if(e.key==="Enter")$("#loginBtn").click()});
$("#logoutBtn").onclick=async()=>{try{await fetch("/api/logout",{method:"POST",credentials:"same-origin"})}finally{setAuth(false)}};
checkSession();


function readFourCC(v,o){return String.fromCharCode(v[o],v[o+1],v[o+2],v[o+3])}
function rgb565(c){const r=((c>>11)&31)*255/31,g=((c>>5)&63)*255/63,b=(c&31)*255/31;return [r|0,g|0,b|0]}
function decodeBC1(data,width,height){
  const out=new Uint8ClampedArray(width*height*4),bw=Math.ceil(width/4),bh=Math.ceil(height/4);let p=0;
  for(let by=0;by<bh;by++)for(let bx=0;bx<bw;bx++){
    const c0=data[p]|data[p+1]<<8,c1=data[p+2]|data[p+3]<<8;p+=4;
    const a=rgb565(c0),b=rgb565(c1),pal=[a,b];
    if(c0>c1){pal[2]=a.map((x,i)=>(2*x+b[i])/3|0);pal[3]=a.map((x,i)=>(x+2*b[i])/3|0)}
    else{pal[2]=a.map((x,i)=>(x+b[i])/2|0);pal[3]=[0,0,0]}
    let bits=(data[p]|data[p+1]<<8|data[p+2]<<16|data[p+3]<<24)>>>0;p+=4;
    for(let py=0;py<4;py++)for(let px=0;px<4;px++){
      const idx=(bits>>>(2*(py*4+px)))&3,x=bx*4+px,y=by*4+py;if(x>=width||y>=height)continue;
      const q=(y*width+x)*4,c=pal[idx];out[q]=c[0];out[q+1]=c[1];out[q+2]=c[2];out[q+3]=(c0<=c1&&idx===3)?0:255;
    }
  }return out;
}
function parseDDS(buf){
  const u8=new Uint8Array(buf),dv=new DataView(buf);
  if(readFourCC(u8,0)!=="DDS ")throw Error("Not a DDS file.");
  const height=dv.getUint32(12,true),width=dv.getUint32(16,true),fourCC=readFourCC(u8,84);
  if(fourCC!=="DXT1")throw Error("Source DDS must be DXT1/BC1.");
  const offset=128,size=Math.ceil(width/4)*Math.ceil(height/4)*8;
  if(u8.length<offset+size)throw Error("DDS payload is incomplete.");
  return {width,height,fourCC,pixels:decodeBC1(u8.subarray(offset,offset+size),width,height)};
}
function renderSource(dds){
  atlasCanvas.width=dds.width;atlasCanvas.height=dds.height;overlayCanvas.width=dds.width;overlayCanvas.height=dds.height;
  actx.putImageData(new ImageData(dds.pixels,dds.width,dds.height),0,0);paintReplacements();drawOverlay();
}
function drawOverlay(){
  octx.clearRect(0,0,overlayCanvas.width,overlayCanvas.height);if(!sourceDDS)return;
  const showDb=$("#showDb").checked,showSlice=$("#showSlice").checked,w=sourceDDS.width,h=sourceDDS.height,cols=w/64,rows=h/64;
  octx.lineWidth=1;octx.font="16px ui-monospace,monospace";octx.textBaseline="top";
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const x=c*64,y=r*64,idx=r*cols+c;octx.strokeStyle="rgba(120,150,210,.38)";octx.strokeRect(x+.5,y+.5,64,64);
    if(showDb||showSlice){const t=showDb&&showSlice?idx+"/"+(idx+1):showDb?String(idx):String(idx+1);octx.fillStyle="rgba(0,0,0,.72)";octx.fillRect(x+2,y+2,Math.max(30,t.length*10+6),20);octx.fillStyle="#fff";octx.fillText(t,x+5,y+4)}
  }
  if(icons.length){const start=Number(startIndex.value)||0;icons.forEach((_,i)=>{const idx=start+i;if(idx>=cols*rows)return;const x=(idx%cols)*64,y=Math.floor(idx/cols)*64;octx.strokeStyle="#7cff9b";octx.lineWidth=3;octx.strokeRect(x+1.5,y+1.5,61,61)})}
}
function detectVisibleBounds(img){
  const c=document.createElement("canvas"),ctx=c.getContext("2d",{willReadFrequently:true});
  c.width=img.naturalWidth;c.height=img.naturalHeight;ctx.drawImage(img,0,0);
  const d=ctx.getImageData(0,0,c.width,c.height).data;
  let minX=c.width,minY=c.height,maxX=-1,maxY=-1;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    if(d[(y*c.width+x)*4+3]>8){
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
    }
  }
  return maxX<0?{x:0,y:0,w:c.width,h:c.height}:{x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
}
function getWatermarkLayout(){
  if(!watermarkImage)return null;
  const b=watermarkCrop||{x:0,y:0,w:watermarkImage.naturalWidth,h:watermarkImage.naturalHeight};
  const maxW=62,maxH=13,padBottom=1;
  const scale=Math.min(maxW/b.w,maxH/b.h);
  const w=Math.max(1,b.w*scale),h=Math.max(1,b.h*scale);
  return {b,w,h,x:(64-w)/2,y:64-padBottom-h};
}
function drawWatermarkTo(ctx,x=0,y=0){
  const l=getWatermarkLayout();if(!l)return;
  ctx.drawImage(watermarkImage,l.b.x,l.b.y,l.b.w,l.b.h,x+l.x,y+l.y,l.w,l.h);
}
function drawIconWithOptionalWatermark(it,x,y){
  actx.drawImage(it.image,x,y,64,64);
  if(it.watermark&&watermarkImage)drawWatermarkTo(actx,x,y);
}
function paintReplacements(){
  if(!sourceDDS||!icons.length){if(sourceDDS)$("#selectionSummary").textContent="No replacements selected.";return}
  const cols=sourceDDS.width/64,start=Number(startIndex.value)||0,max=cols*(sourceDDS.height/64);
  icons.forEach((it,i)=>{const idx=start+i;if(idx>=max)return;const x=(idx%cols)*64,y=Math.floor(idx/cols)*64;drawIconWithOptionalWatermark(it,x,y)});
  $("#selectionSummary").textContent="Replacing DB "+start+"–"+(start+icons.length-1)+" ("+icons.length+" icons).";
}
async function loadImageFile(file){return new Promise((res,rej)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);res(img)};img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("Failed to load "+file.name))};img.src=url})}
ddsInput.onchange=async()=>{
  try{
    const f=ddsInput.files[0];if(!f)return;sourceDDS=parseDDS(await f.arrayBuffer());
    if(sourceDDS.width%64||sourceDDS.height%64)throw Error("DDS dimensions must be divisible by 64.");
    renderSource(sourceDDS);$("#ddsInfo").textContent="Loaded "+f.name+": "+sourceDDS.width+"×"+sourceDDS.height+", "+sourceDDS.fourCC+". "+(sourceDDS.width/64)+"×"+(sourceDDS.height/64)+" grid.";exportBtn.disabled=false;
  }catch(e){sourceDDS=null;exportBtn.disabled=true;$("#ddsInfo").textContent=e.message}
};
function syncWatermarkAll(){
  const master=$("#watermarkAll");
  if(!master)return;
  master.checked=!!watermarkImage && icons.length>0 && icons.every(x=>x.watermark);
}
function renderQueue(){
  const box=$("#iconQueue"),section=$("#queueSection");box.innerHTML="";section.classList.toggle("hidden",!icons.length);
  const start=Number(startIndex.value)||0;
  icons.forEach((it,i)=>{
    const card=document.createElement("div");card.className="queue-card";card.draggable=true;card.dataset.index=i;
    const wm=it.watermark&&watermarkUrl?'<img class="queue-wm-preview" src="'+watermarkUrl+'" alt="">':"";
    card.innerHTML='<span class="queue-number">#'+(i+1)+' · DB '+(start+i)+'</span><div class="queue-thumb-wrap"><img class="queue-thumb" src="'+it.url+'" alt="">'+wm+'</div><div class="queue-meta"><span class="queue-name" title="'+it.file.name+'">'+it.file.name+'</span><label class="queue-watermark"><input type="checkbox" '+(it.watermark?"checked":"")+' '+(!watermarkImage?"disabled":"")+'> Watermark</label></div>';
    const check=card.querySelector(".queue-watermark input");
    check.addEventListener("pointerdown",e=>e.stopPropagation());
    check.addEventListener("click",e=>e.stopPropagation());
    check.addEventListener("change",()=>{it.watermark=check.checked;renderQueue();if(sourceDDS){paintReplacements();drawOverlay()}});
    card.addEventListener("dragstart",e=>{if(e.target===check){e.preventDefault();return}card.classList.add("dragging")});
    card.addEventListener("dragend",()=>{card.classList.remove("dragging");document.querySelectorAll(".drag-over").forEach(x=>x.classList.remove("drag-over"))});
    card.addEventListener("dragover",e=>{e.preventDefault();card.classList.add("drag-over")});
    card.addEventListener("dragleave",()=>card.classList.remove("drag-over"));
    card.addEventListener("drop",e=>{e.preventDefault();const from=Number(document.querySelector(".queue-card.dragging")?.dataset.index),to=Number(card.dataset.index);if(Number.isNaN(from)||from===to)return;const [moved]=icons.splice(from,1);icons.splice(to,0,moved);renderQueue();if(sourceDDS)renderSource(sourceDDS)});
    box.appendChild(card);
  });
  syncWatermarkAll();
}
iconInput.onchange=async()=>{
  icons.forEach(x=>x.url&&URL.revokeObjectURL(x.url));icons=[];
  for(const f of [...iconInput.files]){try{const image=await loadImageFile(f);icons.push({file:f,image,url:URL.createObjectURL(f),watermark:false})}catch{}}
  $("#iconInfo").textContent=icons.length?icons.length+" replacement icon(s) loaded. Drag cards below to reorder.":"No icons selected.";
  renderQueue();if(sourceDDS)renderSource(sourceDDS);
};
$("#watermarkInput").onchange=async()=>{
  const f=$("#watermarkInput").files[0];
  if(watermarkUrl){URL.revokeObjectURL(watermarkUrl);watermarkUrl=null}
  watermarkImage=null;watermarkCrop=null;
  if(!f){$("#watermarkInfo").textContent="No watermark loaded.";$("#watermarkPreviewWrap").classList.add("hidden");$("#watermarkAll").checked=false;$("#watermarkAll").disabled=true;icons.forEach(x=>x.watermark=false);renderQueue();if(sourceDDS)renderSource(sourceDDS);return}
  try{
    watermarkImage=await loadImageFile(f);watermarkCrop=detectVisibleBounds(watermarkImage);watermarkUrl=URL.createObjectURL(f);
    const pc=$("#watermarkPreview"),pctx=pc.getContext("2d");pc.width=64;pc.height=64;pctx.clearRect(0,0,64,64);
    drawWatermarkTo(pctx,0,0);
    $("#watermarkPreviewWrap").classList.remove("hidden");
    $("#watermarkInfo").textContent="Loaded "+f.name+". Tick Watermark per icon or use Give all watermarks.";$("#watermarkAll").disabled=false;
    renderQueue();if(sourceDDS){paintReplacements();drawOverlay()}
  }catch{$("#watermarkInfo").textContent="Failed to load watermark."}
};
$("#watermarkAll").onchange=()=>{const on=$("#watermarkAll").checked;icons.forEach(x=>x.watermark=on);renderQueue();if(sourceDDS){paintReplacements();drawOverlay()}};
startIndex.oninput=()=>{renderQueue();if(sourceDDS)renderSource(sourceDDS)};
$("#showDb").onchange=drawOverlay;$("#showSlice").onchange=drawOverlay;
function applyAtlasZoom(){const z=Number($("#atlasZoom")?.value||2);document.querySelector(".canvas-shell").style.setProperty("--atlas-zoom",z)}
$("#atlasZoom").onchange=applyAtlasZoom;applyAtlasZoom();

function to565(r,g,b){return ((r>>3)<<11)|((g>>2)<<5)|(b>>3)}
function dist(a,b){const dr=a[0]-b[0],dg=a[1]-b[1],db=a[2]-b[2];return dr*dr+dg*dg+db*db}
function encodeBC1(img,w,h){
  const out=new Uint8Array(Math.ceil(w/4)*Math.ceil(h/4)*8);let p=0,d=img.data;
  for(let by=0;by<h;by+=4)for(let bx=0;bx<w;bx+=4){
    let colors=[],hasAlpha=false,min=[255,255,255],max=[0,0,0];
    for(let py=0;py<4;py++)for(let px=0;px<4;px++){
      const x=Math.min(w-1,bx+px),y=Math.min(h-1,by+py),q=(y*w+x)*4,c=[d[q],d[q+1],d[q+2]],a=d[q+3];
      if(a<128){hasAlpha=true;continue}
      colors.push(c);for(let k=0;k<3;k++){if(c[k]<min[k])min[k]=c[k];if(c[k]>max[k])max[k]=c[k]}
    }
    if(!colors.length){out[p]=0;out[p+1]=0;out[p+2]=0;out[p+3]=0;out[p+4]=255;out[p+5]=255;out[p+6]=255;out[p+7]=255;p+=8;continue}
    let c0=to565(...max),c1=to565(...min);if(hasAlpha){if(c0>c1)[c0,c1]=[c1,c0]}else{if(c0<=c1)[c0,c1]=[c1,c0]}
    const a=rgb565(c0),b=rgb565(c1),pal=[a,b];
    if(c0>c1){pal[2]=a.map((x,i)=>(2*x+b[i])/3|0);pal[3]=a.map((x,i)=>(x+2*b[i])/3|0)}else{pal[2]=a.map((x,i)=>(x+b[i])/2|0);pal[3]=[0,0,0]}
    out[p]=c0&255;out[p+1]=c0>>8;out[p+2]=c1&255;out[p+3]=c1>>8;let bits=0;
    for(let py=0;py<4;py++)for(let px=0;px<4;px++){
      const x=Math.min(w-1,bx+px),y=Math.min(h-1,by+py),q=(y*w+x)*4;let idx=0;
      if(d[q+3]<128&&c0<=c1)idx=3;else{const c=[d[q],d[q+1],d[q+2]],limit=c0>c1?4:3;let best=1e20;for(let i=0;i<limit;i++){const z=dist(c,pal[i]);if(z<best){best=z;idx=i}}}
      bits|=idx<<(2*(py*4+px));
    }
    out[p+4]=bits&255;out[p+5]=(bits>>>8)&255;out[p+6]=(bits>>>16)&255;out[p+7]=(bits>>>24)&255;p+=8;
  }return out;
}
function makeDDS(w,h,bc1){
  const buf=new ArrayBuffer(128+bc1.length),dv=new DataView(buf),u8=new Uint8Array(buf);
  ["D","D","S"," "].forEach((c,i)=>u8[i]=c.charCodeAt(0));dv.setUint32(4,124,true);dv.setUint32(8,0x0002100F,true);dv.setUint32(12,h,true);dv.setUint32(16,w,true);dv.setUint32(20,bc1.length,true);
  dv.setUint32(76,32,true);dv.setUint32(80,0x4,true);["D","X","T","1"].forEach((c,i)=>u8[84+i]=c.charCodeAt(0));dv.setUint32(108,0x1000,true);u8.set(bc1,128);return new Blob([buf],{type:"application/octet-stream"});
}
exportBtn.onclick=()=>{
  try{
    if(!sourceDDS)throw Error("Load a DDS first.");
    const max=(sourceDDS.width/64)*(sourceDDS.height/64),start=Number(startIndex.value)||0;
    if(start<0||start+icons.length>max)throw Error("Replacement range exceeds atlas slots.");
    $("#exportStatus").textContent="Encoding DXT1A…";
    const img=actx.getImageData(0,0,sourceDDS.width,sourceDDS.height),bc1=encodeBC1(img,sourceDDS.width,sourceDDS.height),blob=makeDDS(sourceDDS.width,sourceDDS.height,bc1),a=document.createElement("a");
    const url=URL.createObjectURL(blob);a.href=url;a.download="item-patched-dxt1a.dds";a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
    $("#exportStatus").textContent="Done. Exported "+sourceDDS.width+"×"+sourceDDS.height+" DDS DXT1A.";
  }catch(e){$("#exportStatus").textContent=e.message}
};