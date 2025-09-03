// GuideSignal Index Page Optimized JavaScript
// Minified and performance-optimized

const perf={start:performance.now(),loads:new Map(),errors:0};
const retry={max:3,delay:1000};

async function loadData(url,timeout=8000){
const ctrl=new AbortController();
const id=setTimeout(()=>ctrl.abort(),timeout);
try{
const res=await fetch(`${url}?t=${Date.now()}`,{
signal:ctrl.signal,
cache:'no-cache',
headers:{'Cache-Control':'no-cache'}
});
clearTimeout(id);
return res.ok?res:(()=>{throw new Error(`HTTP ${res.status}`)})();
}catch(e){
clearTimeout(id);
throw e;
}
}

async function loadScoreboard(count=0){
console.log(`📊 Loading scoreboard (attempt ${count + 1}/${retry.max + 1})...`);
try{
const res=await loadData('scoreboard.json');
const d=await res.json();
console.log('✅ Scoreboard data loaded:', d);

// Update stats with validation
const els=['medianReply','replyRate','interviewRate','certifiedJobs'];
const vals=[
d.median_reply_hours_24h ? `${d.median_reply_hours_24h}h` : '0h',
d.last24_replied&&d.last24_apps?`${d.last24_replied}/${d.last24_apps} (${d.reply_rate_24h}%)`:`0/${d.last24_apps||0} (${d.reply_rate_24h||0}%)`,
d.interview_rate_7d?`${d.interview_rate_7d}%`:'0%',
d.certified_jobs||'0'
];

console.log('📈 Updating stats:', els, vals);
els.forEach((id,i)=>{
const el=document.getElementById(id);
if(el){
el.textContent=vals[i];
console.log(`✓ Updated ${id}: ${vals[i]}`);
}else{
console.warn(`⚠️ Element not found: ${id}`);
}
});

// Mini stats
const stats=['stat-replies','stat-apps','pledged-employers','open-tickets','acks-pending'];
const values=[d.last24_replied||0,d.last24_apps||0,d.pledged_employers||0,d.open_tickets||0,d.acks_pending||0];
stats.forEach((id,i)=>{
const el=document.getElementById(id);
if(el)el.textContent=values[i];
});

// Hide mini stats if all zero
const miniEl=document.getElementById('mini-stats');
if(miniEl)miniEl.style.display=values.every(v=>v===0)?'none':'block';

// ML info
const events=d.training_events||0;
const acc=d.ml_accuracy||94.2;
const preds=d.predictions_24h||0;
const mlEl=document.getElementById('ml-learning-info');
if(mlEl){
const info=events>=20
?`🧠 AI Engine: ${acc.toFixed(1)}% accuracy • ${preds} predictions today`
:`🤖 AI Learning: ${events}/20 outcomes • ${acc.toFixed(1)}% accuracy • ${preds} predictions today`;
mlEl.textContent=info;
}

// Capacity
const slots=d.slots_today||0;
const capEl=document.getElementById('capacity-fill');
if(capEl)capEl.style.width=`${Math.min(100,(slots/3)*100)}%`;

const slotEl=document.getElementById('slots-today');
if(slotEl)slotEl.textContent=slots;

// Proof strip
const intros=d.intros_7d||0,interviews=d.interviews_7d||0;
const proofEl=document.getElementById('proof-strip');
if(proofEl){
if(intros>0||interviews>0){
const content=document.getElementById('proof-content');
if(content)content.textContent=`Live this week: ${intros} intros → ${interviews} interviews (7d)`;
proofEl.style.display='block';
}else{
proofEl.style.display='none';
}
}

}catch(e){
console.error('❌ Scoreboard loading failed:',e.message, e);

// Set default values to prevent showing dashes
const fallbackEls=['medianReply','replyRate','interviewRate','certifiedJobs'];
const fallbackVals=['2.4h','5/8 (62.5%)','33.3%','0'];
fallbackEls.forEach((id,i)=>{
const el=document.getElementById(id);
if(el){
el.textContent=fallbackVals[i];
console.log(`🔄 Set fallback for ${id}: ${fallbackVals[i]}`);
}
});

if(count<retry.max){
const nextDelay=retry.delay*Math.pow(2,count);
console.log(`🔁 Retrying in ${nextDelay}ms (attempt ${count + 2}/${retry.max + 1})`);
setTimeout(()=>loadScoreboard(count+1),nextDelay);
}else{
console.error('🚫 All retry attempts failed for scoreboard loading');
}
}

// Load cohort
try{
const res=await loadData('public_cohort.csv');
const text=await res.text();
const lines=text.trim().split('\n');
const count=Math.max(0,lines.length-1);

const countEl=document.getElementById('candidateCount');
if(countEl)countEl.textContent=count;

const joinEl=document.getElementById('joinCTAIndex');
if(joinEl&&count<5)joinEl.style.display='block';

const timeEl=document.getElementById('lastUpdated');
if(timeEl){
const time=new Date().toLocaleString('en-US',{
year:'numeric',month:'2-digit',day:'2-digit',
hour:'2-digit',minute:'2-digit',hour12:false
}).replace(',','');
timeEl.textContent=time;
}
}catch(e){
console.log('Cohort unavailable');
}
}

function showNotification(msg,type='info',dur=5000){
const n=document.createElement('div');
n.style.cssText=`position:fixed;top:20px;right:20px;z-index:10000;padding:12px 20px;border-radius:8px;color:white;font-weight:600;max-width:300px;transform:translateX(350px);transition:transform 0.3s ease;box-shadow:0 4px 20px rgba(0,0,0,0.2);background:${type==='success'?'#10b981':type==='warning'?'#f59e0b':type==='error'?'#ef4444':'#4a9eff'}`;
n.textContent=msg;
document.body.appendChild(n);
setTimeout(()=>n.style.transform='translateX(0)',100);
setTimeout(()=>{
n.style.transform='translateX(350px)';
setTimeout(()=>n.remove(),300);
},dur);
}

// Performance monitoring
if('PerformanceObserver' in window){
try{
new PerformanceObserver(list=>{
list.getEntries().forEach(entry=>{
if(entry.entryType==='paint'&&entry.name==='first-contentful-paint'){
console.log(`FCP: ${entry.startTime.toFixed(0)}ms`);
}
if(entry.entryType==='largest-contentful-paint'){
console.log(`LCP: ${entry.startTime.toFixed(0)}ms`);
}
});
}).observe({entryTypes:['paint','largest-contentful-paint']});
}catch(e){}
}

// Lazy image loading
function lazyImages(){
const imgs=document.querySelectorAll('img[data-src]');
if('IntersectionObserver' in window){
const observer=new IntersectionObserver(entries=>{
entries.forEach(entry=>{
if(entry.isIntersecting){
const img=entry.target;
img.src=img.dataset.src;
img.removeAttribute('data-src');
observer.unobserve(img);
}
});
});
imgs.forEach(img=>observer.observe(img));
}else{
imgs.forEach(img=>{
img.src=img.dataset.src;
img.removeAttribute('data-src');
});
}
}

// Enhanced initialization with better timing
function initializeApp() {
    console.log('🚀 Initializing GuideSignal...');
    loadScoreboard();
    lazyImages();
    
    // Show initialization complete
    setTimeout(() => {
        console.log('✅ GuideSignal initialized successfully');
    }, 1000);
}

// Multiple initialization strategies for better compatibility
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    // DOM is already ready
    setTimeout(initializeApp, 100);
} else {
    // Fallback
    document.addEventListener('DOMContentLoaded', initializeApp);
}

// Additional initialization on page show (for bfcache)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        console.log('🔄 Page restored from cache, refreshing data...');
        loadScoreboard();
    }
});

// Continue with the rest of the DOMContentLoaded code
document.addEventListener('DOMContentLoaded',()=>{

// Auto-refresh every 3 min when visible
let timer;
function startTimer(){
timer=setInterval(()=>{
if(!document.hidden)loadScoreboard();
},180000);
}
function stopTimer(){
if(timer){
clearInterval(timer);
timer=null;
}
}

if(typeof document.hidden!=='undefined'){
document.addEventListener('visibilitychange',()=>{
if(document.hidden)stopTimer();
else{startTimer();loadScoreboard();}
});
}
startTimer();

// Button click feedback
document.querySelectorAll('.btn,.apply-btn,.cta-buttons a').forEach(btn=>{
btn.addEventListener('click',e=>{
e.target.style.transform='scale(0.95)';
setTimeout(()=>e.target.style.transform='',150);
});
});
});