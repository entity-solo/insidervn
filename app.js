const fmtNum=n=>{if(n==null)return"\u2014";if(n>=1e6)return(n/1e6).toFixed(1)+"M";if(n>=1e3)return(n/1e3).toFixed(0)+"K";return n.toLocaleString("vi-VN")};
const fmtVal=(s,p)=>{if(!s||!p)return null;const v=s*p;if(v>=1e9)return(v/1e9).toFixed(1)+" tỷ";return(v/1e6).toFixed(0)+" triệu"};
const fmtDate=s=>{if(!s)return"\u2014";const[y,m,d]=s.split("-");return d+"/"+m+"/"+y};
const fmtPrice=n=>{if(!n)return"\u2014";return n.toLocaleString("vi-VN")+"đ"};

const WINRATES={"Trần Minh Chính": {"person": "Trần Minh Chính", "wr": 100.0, "w": 46, "l": 0, "t": 46, "pnl": 52.86, "total": 71123697900, "tickers": ["HDC"]}, "Võ Đông Đức": {"person": "Võ Đông Đức", "wr": 100.0, "w": 36, "l": 0, "t": 36, "pnl": 127.42, "total": 58375370980, "tickers": ["CCA"]}, "Nguyễn Thúy Ly": {"person": "Nguyễn Thúy Ly", "wr": 100.0, "w": 17, "l": 0, "t": 17, "pnl": 22.33, "total": 1694952000, "tickers": ["HMC"]}, "Võ Thành Đàng": {"person": "Võ Thành Đàng", "wr": 96.9, "w": 63, "l": 2, "t": 65, "pnl": 49.6, "total": 510511883000, "tickers": ["QNS"]}, "Công đoàn MBB": {"person": "Công đoàn MBB", "wr": 92.5, "w": 37, "l": 3, "t": 40, "pnl": 74.17, "total": 107794725680, "tickers": ["MBB", "MSB"]}, "Nguyễn Thanh Bình": {"person": "Nguyễn Thanh Bình", "wr": 90.9, "w": 10, "l": 1, "t": 11, "pnl": 49.42, "total": 39583920000, "tickers": ["CSV", "GMD", "KHB", "QBS"]}, "Nguyễn Thị Mai Lan": {"person": "Nguyễn Thị Mai Lan", "wr": 87.1, "w": 27, "l": 4, "t": 31, "pnl": 101.85, "total": 26601891000, "tickers": ["HU1", "LBE", "LHC", "QTC"]}, "Nguyễn Duy Hưng": {"person": "Nguyễn Duy Hưng", "wr": 84.9, "w": 45, "l": 8, "t": 53, "pnl": 35.07, "total": 24997881000, "tickers": ["BTD", "MFS", "PAN"]}, "Phạm Uyên Nguyên": {"person": "Phạm Uyên Nguyên", "wr": 83.3, "w": 20, "l": 4, "t": 24, "pnl": 68.26, "total": 24273094000, "tickers": ["AGP", "ITD"]}, "Nguyễn Văn Nghĩa": {"person": "Nguyễn Văn Nghĩa", "wr": 83.3, "w": 5, "l": 1, "t": 6, "pnl": 24.13, "total": 46352000000, "tickers": ["LCG", "PSD"]}, "Công đoàn PAC": {"person": "Công đoàn PAC", "wr": 83.3, "w": 25, "l": 5, "t": 30, "pnl": 16.19, "total": 39829146100, "tickers": ["PAC"]}, "Ngô Phương Anh": {"person": "Ngô Phương Anh", "wr": 79.2, "w": 19, "l": 5, "t": 24, "pnl": 34.65, "total": 28593000540, "tickers": ["CMC", "ECI", "LTC"]}, "Lê Quang Phúc": {"person": "Lê Quang Phúc", "wr": 77.8, "w": 21, "l": 6, "t": 27, "pnl": 28.42, "total": 25076157250, "tickers": ["HKT", "PDR", "PNJ"]}, "Lê Hải Đoàn": {"person": "Lê Hải Đoàn", "wr": 75.0, "w": 21, "l": 7, "t": 28, "pnl": 36.42, "total": 29008606000, "tickers": ["HIG", "KHB", "ONE", "PJT"]}, "Hồ Đức Lam": {"person": "Hồ Đức Lam", "wr": 75.0, "w": 9, "l": 3, "t": 12, "pnl": 35.49, "total": 71190600600, "tickers": ["DQC"]}, "Trần Thị Thu": {"person": "Trần Thị Thu", "wr": 75.0, "w": 6, "l": 2, "t": 8, "pnl": 24.13, "total": -4567832000, "tickers": ["CET", "HCI", "PLC"]}, "Lê Thị Hà Thành": {"person": "Lê Thị Hà Thành", "wr": 75.0, "w": 15, "l": 5, "t": 20, "pnl": 6.4, "total": -60179577000, "tickers": ["DIG"]}, "Nguyễn Thị Thanh Huyền": {"person": "Nguyễn Thị Thanh Huyền", "wr": 74.1, "w": 20, "l": 7, "t": 27, "pnl": 7.35, "total": -234406286940, "tickers": ["DBC", "DIG", "GDT", "PGC"]}, "Nguyễn Tuấn Anh": {"person": "Nguyễn Tuấn Anh", "wr": 68.4, "w": 13, "l": 6, "t": 19, "pnl": 10.79, "total": -3612664200, "tickers": ["FDC", "HDC", "IBD", "KVC", "ONW", "PHH"]}, "Nguyễn Thị Thu Hằng": {"person": "Nguyễn Thị Thu Hằng", "wr": 66.7, "w": 6, "l": 3, "t": 9, "pnl": -1.18, "total": -817911120, "tickers": ["CAP", "DBT", "GIL", "NED"]}, "Công đoàn BVH": {"person": "Công đoàn BVH", "wr": 66.7, "w": 18, "l": 9, "t": 27, "pnl": 17.34, "total": -11428728360, "tickers": ["BVH"]}, "Nguyễn Thị Nga": {"person": "Nguyễn Thị Nga", "wr": 66.7, "w": 4, "l": 2, "t": 6, "pnl": 43.84, "total": 20313439600, "tickers": ["DVG", "GEE", "GGG", "MQN"]}, "Nguyễn Xuân Dũng": {"person": "Nguyễn Xuân Dũng", "wr": 64.7, "w": 11, "l": 6, "t": 17, "pnl": -10.37, "total": -72890757200, "tickers": ["CKG", "DRL", "PRC"]}, "Nguyễn Thanh Sơn": {"person": "Nguyễn Thanh Sơn", "wr": 60.0, "w": 9, "l": 6, "t": 15, "pnl": 45.14, "total": -2590174600, "tickers": ["ATA", "CAP", "DIC", "HPP", "HSV", "KHB", "NLG"]}, "Ngô Thị Thanh Huyền": {"person": "Ngô Thị Thanh Huyền", "wr": 60.0, "w": 12, "l": 8, "t": 20, "pnl": 17.74, "total": 7130920000, "tickers": ["CMC", "EBS", "ECI"]}, "Nguyễn Hùng Cường": {"person": "Nguyễn Hùng Cường", "wr": 59.5, "w": 22, "l": 15, "t": 37, "pnl": -4.22, "total": -419515596700, "tickers": ["DIG", "HBC", "PAT"]}, "Nguyễn Thị Thủy": {"person": "Nguyễn Thị Thủy", "wr": 59.3, "w": 16, "l": 11, "t": 27, "pnl": 0.49, "total": -25305833400, "tickers": ["DBD", "DHC", "HAR", "MBB", "MIG"]}, "Trần Việt Thắng": {"person": "Trần Việt Thắng", "wr": 57.9, "w": 11, "l": 8, "t": 19, "pnl": -1.81, "total": 15226858000, "tickers": ["DAG", "L40", "LHC", "QTC"]}, "Nguyễn Minh Thắng": {"person": "Nguyễn Minh Thắng", "wr": 54.5, "w": 6, "l": 5, "t": 11, "pnl": 3.27, "total": 495651000, "tickers": ["BVG"]}, "Nguyễn Văn Mạnh": {"person": "Nguyễn Văn Mạnh", "wr": 54.2, "w": 13, "l": 11, "t": 24, "pnl": 2.62, "total": 504573000, "tickers": ["ALT", "CAN", "FRC", "NED", "PMW"]}, "Nguyễn Thanh Nghĩa": {"person": "Nguyễn Thanh Nghĩa", "wr": 47.4, "w": 18, "l": 20, "t": 38, "pnl": 7.08, "total": -92085319700, "tickers": ["DHC"]}, "Vũ Anh Tuấn": {"person": "Vũ Anh Tuấn", "wr": 47.1, "w": 8, "l": 9, "t": 17, "pnl": 77.51, "total": 15158326900, "tickers": ["DZM", "ICN", "IDV", "LCD", "NDC"]}, "Nguyễn Thanh Phong": {"person": "Nguyễn Thanh Phong", "wr": 47.1, "w": 8, "l": 9, "t": 17, "pnl": 19.59, "total": -45870905600, "tickers": ["BWE", "CLW", "DNA"]}, "Nguyễn Văn Hùng": {"person": "Nguyễn Văn Hùng", "wr": 46.4, "w": 13, "l": 15, "t": 28, "pnl": 4.91, "total": 39111201640, "tickers": ["BCM", "HVA", "IBD", "KDM", "KHL", "MAC", "NHA"]}, "Lê Xuân Lương": {"person": "Lê Xuân Lương", "wr": 43.5, "w": 30, "l": 39, "t": 69, "pnl": 6.76, "total": 4313799000, "tickers": ["CAP", "EID", "GVT", "HVT", "INN", "NHH", "PHN"]}, "Đinh Quang Chiến": {"person": "Đinh Quang Chiến", "wr": 36.4, "w": 8, "l": 14, "t": 22, "pnl": 33.04, "total": -23234197500, "tickers": ["HCD", "HDM", "HHS", "LIG", "NTL"]}, "Nguyễn Phương Đông": {"person": "Nguyễn Phương Đông", "wr": 34.8, "w": 8, "l": 15, "t": 23, "pnl": -2.4, "total": 19524221600, "tickers": ["GIL", "HCD", "HDG", "HHS"]}, "Trần Kim Phượng": {"person": "Trần Kim Phượng", "wr": 33.3, "w": 1, "l": 2, "t": 3, "pnl": -13.75, "total": -809970000, "tickers": ["DAH"]}, "Trần Thị Thu Hà": {"person": "Trần Thị Thu Hà", "wr": 30.0, "w": 3, "l": 7, "t": 10, "pnl": 1.78, "total": 6119430000, "tickers": ["C4G", "HNA", "KOS", "PRT"]}, "Đào Văn Chiến": {"person": "Đào Văn Chiến", "wr": 28.6, "w": 6, "l": 15, "t": 21, "pnl": -9.91, "total": -7001768000, "tickers": ["HTT"]}, "Nguyễn Thị Thu Hương": {"person": "Nguyễn Thị Thu Hương", "wr": 25.0, "w": 5, "l": 15, "t": 20, "pnl": -51.52, "total": -8866521400, "tickers": ["DBC", "EME", "FTS", "GAB", "LHC", "MSH", "PPT", "PRC"]}, "Nguyễn Văn Dũng": {"person": "Nguyễn Văn Dũng", "wr": 25.0, "w": 4, "l": 12, "t": 16, "pnl": -11.29, "total": 45552720000, "tickers": ["AMS", "BII", "FTS", "HUT", "KDH", "MCG", "NVT", "PCN"]}, "Nguyễn Anh Tuấn": {"person": "Nguyễn Anh Tuấn", "wr": 13.0, "w": 3, "l": 20, "t": 23, "pnl": -35.09, "total": -41446980880, "tickers": ["FIR", "LPT", "MKV", "PNJ", "PV2", "PXS", "QLD"]}, "Bùi Minh Tuấn": {"person": "Bùi Minh Tuấn", "wr": 0.0, "w": 0, "l": 3, "t": 3, "pnl": -4.0, "total": -125898000, "tickers": ["MRF"]}, "Nguyễn Thị Ngọc Sương": {"person": "Nguyễn Thị Ngọc Sương", "wr": 0.0, "w": 0, "l": 22, "t": 22, "pnl": -14.18, "total": -123548680, "tickers": ["PSC"]}, "Dịp Văn Minh": {"person": "Dịp Văn Minh", "wr": 0.0, "w": 0, "l": 23, "t": 23, "pnl": -82.75, "total": -19567512000, "tickers": ["DNM", "NSG"]}};


const TX_CONFIG={
  buy:{label:"Đã mua",cls:"buy",color:"#10b981"},
  sell:{label:"Đã bán",cls:"sell",color:"#ef4444"},
  register_buy:{label:"Đăng ký mua",cls:"reg_buy",color:"#34d399"},
  register_sell:{label:"Đăng ký bán",cls:"reg_sell",color:"#f87171"}
};

let currentFilter="all";
let currentTab="feed";
let currentRole="all";
let currentPeriod="all";
let feedSort={key:"date",dir:"desc"};
let feedCompact=false;
let WEEKLY_COUNTS=null;

// Anchor "recent" filters to the latest meaningful date in the dataset
function todayStr(){return new Date().toISOString().slice(0,10);}
const TODAY=todayStr();
const DATA_MAX_DATE=(function(){let m="0000";for(const d of DATA){if(d.date_reg&&d.date_reg>m)m=d.date_reg;}return m;})();

// Fast ticker/company lookup for the command palette (built once)
const TICKER_MAP=(function(){const m={};for(const d of DATA){if(!m[d.ticker])m[d.ticker]={ticker:d.ticker,company:d.company,exchange:d.exchange};}return m;})();
const PERSON_INDEX=(function(){const m={};for(const d of DATA){if(!m[d.person])m[d.person]=d.role;}return m;})();
const DATE_ANCHOR=DATA_MAX_DATE>TODAY?TODAY:DATA_MAX_DATE;
function periodCutoff(p){
  if(/^\d{4}$/.test(p))return p+"-01-01";
  const days=parseInt(p,10);
  const d=new Date(DATE_ANCHOR+"T00:00:00Z");
  d.setUTCDate(d.getUTCDate()-days);
  return d.toISOString().slice(0,10);
}

function switchTab(name){
  currentTab=name;
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
  const panel=document.getElementById("panel-"+name);
  if(panel)panel.classList.add("active");
  document.querySelectorAll(".nav-tab").forEach(t=>t.classList.toggle("active", t.dataset.tab===name));
  if(name==="watchlist")renderWatchlist();
  if(name==="winrate")renderWinrateTab();
  if(name==="signals")renderSignals();
  closeMobile();
}

function toggleMobile(){document.getElementById("mobile-menu").classList.toggle("open")}
function closeMobile(){document.getElementById("mobile-menu").classList.remove("open")}
let wrFilter="all";
function setWrFilter(f,el){
  wrFilter=f;
  el.closest(".winrate-filters").querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
  el.classList.add("active");
  renderWinrateTab();
}

function renderWinrateTab(){
  let list=Object.entries(WINRATES).map(([person,d])=>({person,...d,tickers:d.tickers||[]}));
  if(wrFilter==="winner")list=list.filter(r=>r.wr>=50);
  else if(wrFilter==="loser")list=list.filter(r=>r.wr<50);
  else if(wrFilter==="volume")list=list.filter(r=>Math.abs(r.total)>=10000000000);
  list.sort((a,b)=>b.wr-a.wr||b.total-a.total);
  const el=document.getElementById("wr-list");
  if(!list.length){el.innerHTML=`<div class="empty"><div class="empty-icon">&#127942;</div><div class="empty-text">Không có kết quả phù hợp</div></div>`;return}
  el.innerHTML=list.map((r,i)=>{
    const isWin=r.wr>=50;
    const pnlColor=r.pnl>=0?"var(--buy)":"var(--sell)";
    const totalStr=fmtVal(1,Math.abs(r.total));
    const rank=i+1;
    const medal=rank===1?"&#127941;":rank===2?"&#127942;":rank===3?"&#127943;":`<span class="wr-rank-num">${rank}</span>`;
    const tickersStr=Array.isArray(r.tickers)?r.tickers.join(", "):"";
    return `<div class="tx-item ${isWin?'buy':'sell'}" onclick="renderPersonProfile('${r.person.replace(/'/g,"\\'")}');switchTab('stock')" onkeydown="if(event.key==='Enter'||event.key===' ')renderPersonProfile('${r.person.replace(/'/g,"\\'")}');switchTab('stock')" role="button" tabindex="0">
      <div class="tx-ticker" style="font-size:20px;width:40px;text-align:center">${medal}</div>
      <div class="tx-main">
        <div class="tx-company">${r.person}</div>
        <div style="font-size:12px;color:var(--muted)">${tickersStr} — ${r.w}thắng/${r.l}thua</div>
      </div>
      <div style="text-align:right;min-width:80px">
        <div style="font-size:20px;font-weight:800;color:${isWin?'var(--buy)':'var(--sell)'}">${r.wr}%</div>
        <div style="font-size:11px;color:var(--muted)">Win Rate</div>
      </div>
      <div style="text-align:right;min-width:90px">
        <div style="font-weight:700;color:${pnlColor}">${r.pnl>=0?'+':''}${r.pnl.toFixed(1)}%</div>
        <div style="font-size:11px;color:var(--muted)">~${totalStr}</div>
      </div>
    </div>`;
  }).join("");
}

function renderStats(data){
  const buys=data.filter(d=>d.type==="buy"&&(d.executed!==null));
  const sells=data.filter(d=>d.type==="sell"&&(d.executed!==null));
  const regBuys=data.filter(d=>d.type==="buy"&&d.executed===null);
  const regSells=data.filter(d=>d.type==="sell"&&d.executed===null);
  const totalBuyVal=buys.reduce((s,d)=>s+(d.executed||0)*(d.p_from||0),0);
  const totalSellVal=sells.reduce((s,d)=>s+(d.executed||0)*(d.p_from||0),0);
  const netVal=totalBuyVal-totalSellVal;
  const uniqueTickers=[...new Set(data.map(d=>d.ticker))].length;

  document.getElementById("stats-bar").innerHTML=`
    <div class="stat-card"><div class="stat-label">Tổng giao dịch</div><div class="stat-value blue">${data.length}</div></div>
    <div class="stat-card"><div class="stat-label">Đã mua (${buys.length}) + Đăng ký (${regBuys.length})</div><div class="stat-value green">${buys.length+regBuys.length}</div></div>
    <div class="stat-card"><div class="stat-label">Đã bán (${sells.length}) + Đăng ký (${regSells.length})</div><div class="stat-value red">${sells.length+regSells.length}</div></div>
    <div class="stat-card"><div class="stat-label">Giá trị mua ròng</div><div class="stat-value ${netVal>=0?'green':'red'}">${netVal>=0?'+':''}${fmtVal(1,Math.abs(netVal))||'\u2014'}</div></div>
  `;
}

function renderTopInsiders(data){
  const map={};
  data.forEach(d=>{
    if(!map[d.person])map[d.person]={name:d.person,role:d.role,roleKey:d.roleKey,tickers:[],buyCount:0,sellCount:0,netShares:0};
    const m=map[d.person];
    if(!m.tickers.includes(d.ticker))m.tickers.push(d.ticker);
    if(d.type.includes("buy")){m.buyCount++;m.netShares+=(d.executed||d.shares)}
    else if(d.type==="sell"){m.sellCount++;m.netShares-=(d.executed||d.shares)}
  });
  const sorted=Object.values(map).sort((a,b)=>(b.buyCount+b.sellCount)-(a.buyCount+a.sellCount)).slice(0,5);
  if(!sorted.length){document.getElementById("top-insiders").innerHTML="";return}

  document.getElementById("top-insiders").innerHTML=`
    <div class="top-title">Top Insider gần đây</div>
    ${sorted.map(ins=>{
      const initials=ins.name.split(" ").map(w=>w[0]).join("").slice(0,2);
      const net=ins.netShares;
      return `<div class="insider-row">
        <div class="insider-avatar">${initials}</div>
        <div class="insider-info">
          <div class="insider-name">${ins.name}</div>
          <div class="insider-role">${ins.role} — ${ins.tickers.join(", ")}</div>
        </div>
        <div class="insider-txs">
          <div class="insider-count">${ins.buyCount+ins.sellCount} giao dịch</div>
          <div class="insider-net" style="color:${net>=0?'var(--buy)':'var(--sell)'}">Net: ${net>=0?'+':''}${fmtNum(Math.abs(net))}</div>
        </div>
      </div>`;
    }).join("")}
  `;
}
// Google-like search: split query into words, match each word, score by relevance
function scoreMatch(query, text) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const textLower = text.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (textLower === w) score += 10;
    else if (textLower.startsWith(w)) score += 8;
    else if (textLower.includes(w)) score += 5;
    else {
      const stripped = textLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const wStripped = w.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (stripped.includes(wStripped)) score += 4;
      else return 0;
    }
  }
  return score;
}

function googleSearch(query, items, getFields) {
  if (!query) return items;
  const scored = items.map(d => {
    const fields = getFields(d);
    let bestScore = 0;
    for (const f of fields) {
      const s = scoreMatch(query, f);
      if (s > bestScore) bestScore = s;
    }
    return { d, score: bestScore };
  });
  return scored.filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.d);
}

function setFilter(f,btn){
  currentFilter=f;
  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  renderFeed();
}

function setRoleFilter(r,btn){
  currentRole=r;
  document.querySelectorAll(".role-filter").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  renderFeed();
}

function setPeriodFilter(p){
  currentPeriod=p;
  renderFeed();
}

let feedFiltered=[];
let feedLimit=60;
let feedRendered=0;
let feedObserver=null;
let feedLoading=false;

function sparkSVG(values, w, h, color){
  if(!values||values.length<2)return '<span class="spark-none">—</span>';
  const max=Math.max.apply(null,values), min=Math.min.apply(null,values);
  const range=(max-min)||1;
  const step=w/(values.length-1);
  let pts="";
  for(let i=0;i<values.length;i++){
    const x=(i*step).toFixed(1);
    const y=(h-2-((values[i]-min)/range)*(h-4)).toFixed(1);
    pts+=(i?" ":"")+x+","+y;
  }
  const area="0,"+h+" "+pts+" "+w+","+h;
  const cid="sp"+Math.random().toString(36).slice(2,8);
  return '<svg class="spark" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" width="'+w+'" height="'+h+'"><defs><linearGradient id="'+cid+'" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="'+color+'" stop-opacity=".28"/><stop offset="1" stop-color="'+color+'" stop-opacity="0"/></linearGradient></defs><polygon points="'+area+'" fill="url(#'+cid+')"/><polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="1.5" stroke-linejoin="round"/></svg>';
}
function rowSpark(ticker){
  const s=(typeof PRICES!=="undefined"&&PRICES&&PRICES.series)?PRICES.series[ticker]:null;
  if(!s||!s.length)return '<span class="spark-none">—</span>';
  const vals=s.slice(-26);
  const up=vals[vals.length-1]>=vals[0];
  return sparkSVG(vals,64,22,up?'var(--buy)':'var(--sell)');
}

function feedItemHtml(d, idx){
  const isBuy=d.type.includes("buy");
  const badgeCls=isBuy?"buy":"sell";
  const badgeLabel=isBuy?"Mua":"Bán";
  const pSeries=(typeof PRICES!=="undefined"&&PRICES&&PRICES.series)?PRICES.series[d.ticker]:null;
  const lastPx=pSeries&&pSeries.length?pSeries[pSeries.length-1]:null;
  const vPrice=d.p_from!=null?d.p_from:(lastPx!=null?lastPx:null);
  const value=vPrice?fmtVal(d.executed||d.shares,vPrice):null;
  const p1=d.perf_1w, p1m=d.perf_1m;
  const p1cls=p1!=null?(p1>=0?"pos":"neg"):"";
  const p1txt=p1!=null?(p1>=0?"+":"")+p1+"%":"—";
  const pMcls=p1m!=null?(p1m>=0?"pos":"neg"):"";
  const pMtxt=p1m!=null?(p1m>=0?"+":"")+p1m+"%":"—";
  return `<div class="tx-item feed-row ${isBuy?'buy':'sell'}" onclick="openModal('${d.id}')" onkeydown="if(event.key==='Enter'||event.key===' ')openModal('${d.id}')" role="button" tabindex="0">
    <div class="fc-date">${fmtDate(d.date_reg)}</div>
    <div class="fc-tk"><span onclick="event.stopPropagation();jumpToStock('${d.ticker}')">${d.ticker}</span></div>
    <div class="fc-person"><div class="fc-pname" title="${d.person}" onclick="event.stopPropagation();jumpToPerson('${d.id}')">${d.person}</div><span class="fc-role ${d.roleKey}">${d.role}</span></div>
    <div><span class="tx-badge ${badgeCls}"><span class="tx-badge-dot"></span>${badgeLabel}</span></div>
    <div class="fc-r" style="color:${isBuy?'var(--buy)':'var(--sell)'}">${isBuy?'+':'−'}${fmtNum(d.executed||d.shares)}</div>
    <div class="fc-r fc-value">${value||"—"}</div>
    <div class="fc-r ${p1cls}">${p1txt}</div>
    <div class="fc-r ${pMcls}">${pMtxt}</div>
    <div class="fc-spark">${rowSpark(d.ticker)}</div>
  </div>`;
}

function feedHeadHtml(){
  const cols=[
    {key:"date",label:"Ngày",cls:""},
    {key:"ticker",label:"Mã",cls:""},
    {key:"person",label:"Người / Vị trí",cls:""},
    {key:"type",label:"Loại",cls:""},
    {key:"shares",label:"KL",cls:"th-r"},
    {key:"value",label:"Giá trị",cls:"th-r"},
    {key:"perf1w",label:"1T",cls:"th-r"},
    {key:"perf1m",label:"1Th",cls:"th-r"},
    {key:"",label:"Xu hướng",cls:"th-r"}
  ];
  const sortable=["date","shares","value","perf1w","perf1m"];
  return cols.map(c=>{
    if(!c.key)return `<div class="${c.cls}"></div>`;
    const active=feedSort.key===c.key;
    const arrow=active?(feedSort.dir==="asc"?" ▲":" ▼"):"";
    const isSort=sortable.includes(c.key);
    return `<div class="${c.cls}${active?" th-active":""}${isSort?" th-sort":""}"${isSort?` onclick="setFeedSort('${c.key}')"`:""}>${c.label}${arrow}</div>`;
  }).join("");
}

function setFeedSort(key){
  if(feedSort.key===key){feedSort.dir=feedSort.dir==="asc"?"desc":"asc";}
  else{feedSort.key=key;feedSort.dir=(key==="ticker"?"asc":"desc");}
  renderFeed();
}

function weeklyTxCounts(n){
  const weeks=[];for(let i=0;i<n;i++)weeks.push(0);
  for(const d of DATA){
    if(!d.date_reg)continue;
    const diff=(new Date(DATA_MAX_DATE)-new Date(d.date_reg))/86400000;
    const wk=Math.floor(diff/7);
    if(wk>=0&&wk<n)weeks[n-1-wk]++;
  }
  return weeks;
}

function renderFeedStats(data){
  const buys=data.filter(d=>d.type==="buy");
  const sells=data.filter(d=>d.type==="sell");
  const dip=data.filter(d=>d.dip!=null&&d.dip<=-5).length;
  const total=buys.length+sells.length;
  const buyRatio=total?Math.round(buys.length/total*100):0;
  const clusters=(function(){
    const m={};
    data.forEach(d=>{if(d.type==="buy"){(m[d.ticker]=m[d.ticker]||new Set()).add(d.person);}});
    let c=0;for(const t in m)if(m[t].size>=2)c++;
    return c;
  })();
  const pLabels={all:"toàn thời gian",'7':'7 ngày','30':'30 ngày','90':'3 tháng','180':'6 tháng','365':'1 năm'};
  const periodLabel=pLabels[currentPeriod]||currentPeriod;
  if(!WEEKLY_COUNTS)WEEKLY_COUNTS=weeklyTxCounts(12);
  const spark=sparkSVG(WEEKLY_COUNTS,260,54,"var(--accent)");
  document.getElementById("feed-stats").innerHTML=`
    <div class="dash-hero">
      <div class="dash-hero-main">
        <div class="eyebrow">Tổng giao dịch nội bộ</div>
        <div class="dash-hero-num">${data.length.toLocaleString("vi-VN")}</div>
        <div class="dash-hero-sub">giao dịch · ${periodLabel}</div>
      </div>
      <div class="dash-hero-spark"><div class="dash-hero-spark-label">Khối lượng 12 tuần</div>${spark}</div>
    </div>
    <div class="dash-cards">
      <div class="kpi-card"><div class="kpi-label">Tỷ lệ Mua/Bán</div><div class="kpi-value ${buyRatio>=50?'buy':'sell'}">${buyRatio}%</div><div class="kpi-sub">${buys.length} mua · ${sells.length} bán</div></div>
      <div class="kpi-card"><div class="kpi-label">Cụm mua rổ</div><div class="kpi-value accent">${clusters}</div><div class="kpi-sub">mã có ≥2 insider mua</div></div>
      <div class="kpi-card"><div class="kpi-label">Mua khi giảm</div><div class="kpi-value buy">${dip}</div><div class="kpi-sub">giảm ≥5% trước GD</div></div>
    </div>`;
}

function toggleDensity(){
  feedCompact=!feedCompact;
  const t=document.querySelector(".table-scroll");
  if(t)t.classList.toggle("compact",feedCompact);
  const l=document.getElementById("density-label");
  if(l)l.textContent=feedCompact?"Mở rộng":"Thu gọn";
}

function renderFeed(){
  let data=[...DATA];
  const searchQ=(document.getElementById("feed-search")?.value||"").trim().toLowerCase();

  if(currentFilter==="buy")data=data.filter(d=>d.type==="buy");
  else if(currentFilter==="sell")data=data.filter(d=>d.type==="sell");
  else if(currentFilter==="register")data=data.filter(d=>d.executed===null);
  else if(currentFilter==="HOSE")data=data.filter(d=>d.exchange==="HOSE");
  else if(currentFilter==="HNX")data=data.filter(d=>d.exchange==="HNX");
  else if(currentFilter==="UPCoM")data=data.filter(d=>d.exchange==="UPCoM");

  if(currentRole!=="all")data=data.filter(d=>d.roleKey===currentRole);
  if(currentPeriod!=="all"){
    const cutoff=periodCutoff(currentPeriod);
    data=data.filter(d=>d.date_reg&&d.date_reg>=cutoff);
  }

  if(searchQ) data = googleSearch(searchQ, data, d => [d.ticker, d.person, d.company, d.role]);

  const dir=feedSort.dir==="asc"?1:-1;
  const sortVal=d=>{
    switch(feedSort.key){
      case "value": return (d.executed||d.shares)*(d.p_from||0);
      case "shares": return (d.executed||d.shares);
      case "perf1w": return d.perf_1w==null?-Infinity:d.perf_1w;
      case "perf1m": return d.perf_1m==null?-Infinity:d.perf_1m;
      case "ticker": return d.ticker;
      default: return d.date_reg;
    }
  };
  data.sort((a,b)=>{const va=sortVal(a),vb=sortVal(b);if(va<vb)return -1*dir;if(va>vb)return 1*dir;return 0;});

  feedFiltered=data;
  document.getElementById("feed-head").innerHTML=feedHeadHtml();
  renderFeedStats(data);
  renderTopInsiders(data);
  renderRecentlyViewed();

  const list=document.getElementById("tx-list");
  if(!data.length){
    list.innerHTML=`<div class="feed-empty">Không có giao dịch phù hợp</div>`;
    feedRendered=0;
    updateFeedSentinel();
    return;
  }

  feedLimit=60;
  feedRendered=0;
  renderFeedBatch(true);
  setupFeedScroll();
}

function renderFeedBatch(reset){
  const list=document.getElementById("tx-list");
  const end=Math.min(feedLimit, feedFiltered.length);
  if(reset){
    feedRendered=end;
    list.innerHTML=feedFiltered.slice(0,end).map((d,i)=>feedItemHtml(d,i)).join("");
  } else {
    if(feedLoading)return;
    feedLoading=true;
    const start=feedRendered;
    const newHtml=feedFiltered.slice(start,end).map((d,i)=>feedItemHtml(d,start+i)).join("");
    list.insertAdjacentHTML("beforeend", newHtml);
    feedRendered=end;
    feedLoading=false;
  }
  updateFeedSentinel();
}

function loadMoreFeed(){
  if(feedLimit>=feedFiltered.length)return;
  feedLimit=Math.min(feedFiltered.length, feedLimit+60);
  renderFeedBatch(false);
}

function setupFeedScroll(){
  let sentinel=document.getElementById("feed-sentinel");
  if(!sentinel){
    sentinel=document.createElement("div");
    sentinel.id="feed-sentinel";
    const sc=document.querySelector(".table-scroll");
    if(sc&&sc.parentNode)sc.parentNode.insertBefore(sentinel, sc.nextSibling);
  }
  updateFeedSentinel();
}

function updateFeedSentinel(){
  const sentinel=document.getElementById("feed-sentinel");
  if(!sentinel)return;
  if(feedLimit>=feedFiltered.length || feedFiltered.length===0){
    sentinel.style.display="none";
    return;
  }
  sentinel.style.display="block";
  sentinel.innerHTML=`<button class="load-more-btn" onclick="loadMoreFeed()">Xem thêm giao dịch ↓</button>`;
  if(!feedObserver && "IntersectionObserver" in window){
    feedObserver=new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting)loadMoreFeed();
    },{rootMargin:"400px"});
    feedObserver.observe(sentinel);
  }
}

function exportFeedCSV(){
  if(typeof Blob==="undefined"||typeof URL==="undefined"){
    showToast("Trình duyệt không hỗ trợ xuất CSV",false);return;
  }
  const rows=feedFiltered;
  if(!rows.length){showToast("Không có dữ liệu để xuất",false);return;}
  const headers=["Mã","Công ty","Sàn","Người","Vị trí","Loại","Đăng ký (CP)","Thực hiện (CP)","Giá từ","Giá đến","Ngày ĐK","Từ ngày","Đến ngày"];
  const esc=v=>{if(v==null)return"";const s=String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  const lines=[headers.join(",")];
  for(const d of rows){
    lines.push([d.ticker,d.company,d.exchange,d.person,d.role,d.type,d.shares,d.executed,d.p_from,d.p_to,d.date_reg,d.date_from,d.date_to].map(esc).join(","));
  }
  const csv="﻿"+lines.join("\r\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`insidervn-feed-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  showToast("Đã xuất "+rows.length+" giao dịch ra CSV");
}

/* ============ TÍN HIỆU: MUA RỔ (CLUSTER BUYS) + ĐÁNG CHÚ Ý ============ */
let currentSignalView="cluster";
let clusterWindow=14;
let signalExchange="all";
let CLUSTERS={};

function dateKey(d){return d.date_from||d.date_reg;}

function computeClusterList(windowDays){
  const byTicker={};
  for(const d of DATA){
    if(!d.type||!d.type.includes("buy"))continue;
    const dt=dateKey(d);
    if(!dt)continue;
    (byTicker[d.ticker]=byTicker[d.ticker]||[]).push(d);
  }
  const out=[];
  const winMs=windowDays*86400000;
  for(const ticker of Object.keys(byTicker)){
    const txs=byTicker[ticker].slice().sort((a,b)=>dateKey(a).localeCompare(dateKey(b)));
    let i=0;
    while(i<txs.length){
      const base=txs[i];
      const baseMs=new Date(dateKey(base)+"T00:00:00Z").getTime();
      const members=[base];
      let j=i+1;
      while(j<txs.length){
        const t=txs[j];
        const td=new Date(dateKey(t)+"T00:00:00Z").getTime();
        if(td-baseMs>winMs)break;
        if(t.person!==base.person && !members.some(m=>m.person===t.person))members.push(t);
        j++;
      }
      if(members.length>=2){
        const persons=[...new Set(members.map(m=>m.person))];
        const start=dateKey(members[0]);
        const end=dateKey(members[members.length-1]);
        const totalShares=members.reduce((s,m)=>s+(m.executed||m.shares||0),0);
        const totalValue=members.reduce((s,m)=>s+(m.executed||m.shares||0)*(m.p_from||0),0);
        out.push({ticker,company:base.company,exchange:base.exchange,count:persons.length,persons,start,end,totalShares,totalValue});
      }
      i++;
    }
  }
  const seen=new Set();const dedup=[];
  for(const c of out){
    const sig=c.ticker+"|"+c.start+"|"+c.persons.join(",");
    if(seen.has(sig))continue;seen.add(sig);dedup.push(c);
  }
  dedup.sort((a,b)=>b.start.localeCompare(a.start)||b.count-a.count);
  return dedup;
}

function buildClusters(){
  CLUSTERS[14]=computeClusterList(14);
  CLUSTERS[30]=computeClusterList(30);
}

function setSignalView(v,btn){
  currentSignalView=v;
  document.querySelectorAll(".signal-view-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  renderSignals();
}

function setClusterWindow(w,btn){
  clusterWindow=parseInt(w,10);
  document.querySelectorAll(".cluster-win-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  renderClusterBuys();
}

function setSignalExchange(ex){
  signalExchange=ex;
  renderSignals();
}

function renderSignals(){
  if(currentSignalView==="cluster")renderClusterBuys();
  else if(currentSignalView==="dip")renderDipBuys();
  else renderHighlights();
}

function renderDipBuys(){
  let list=DATA.filter(d=>d.type&&d.type.includes("buy")&&d.dip!=null&&d.dip<=-5);
  if(signalExchange!=="all")list=list.filter(d=>d.exchange===signalExchange);
  list.sort((a,b)=>a.dip-b.dip);
  const el=document.getElementById("signals-content");
  if(!list.length){el.innerHTML=`<div class="empty"><div class="empty-icon">&#128200;</div><div class="empty-text">Chưa có giao dịch mua khi giá đang giảm</div></div>`;return;}
  el.innerHTML=`<div class="signal-count">${list.length} lượt mua khi giá đang giảm (giảm ≥5% trước ngày mua)</div>`+list.slice(0,80).map(d=>{
    const dipPct=Math.abs(d.dip).toFixed(0);
    return `<div class="dip-card" onclick="openModal('${d.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')openModal('${d.id}')">
      <div class="dip-head">
        <div class="cluster-ticker">${d.ticker}</div>
        <div class="dip-meta">
          <div class="dip-person">${d.person} <span class="hl-role">· ${d.role}</span></div>
          <div class="cluster-sub">${d.company} · ${fmtDate(d.date_from||d.date_reg)}</div>
        </div>
        <div class="dip-badge">Giảm ${dipPct}% trước mua</div>
      </div>
      <div class="cluster-stats">
        <span class="pos">+${fmtNum(d.executed||d.shares)} cp</span>
        ${d.perf_1m!=null?`<span class="${d.perf_1m>=0?'pos':'neg'}">1Th ${d.perf_1m>=0?'+':''}${d.perf_1m}%</span>`:''}
        ${d.perf_1w!=null?`<span class="${d.perf_1w>=0?'pos':'neg'}">1T ${d.perf_1w>=0?'+':''}${d.perf_1w}%</span>`:''}
      </div>
    </div>`;
  }).join("");
}

function renderClusterBuys(){
  let list=CLUSTERS[clusterWindow]||[];
  if(signalExchange!=="all")list=list.filter(c=>c.exchange===signalExchange);
  const el=document.getElementById("signals-content");
  if(!list.length){el.innerHTML=`<div class="empty"><div class="empty-icon">&#128161;</div><div class="empty-text">Chưa có mua rổ trong khoảng thời gian này</div></div>`;return;}
  el.innerHTML=`<div class="signal-count">${list.length} nhóm mua rổ (${clusterWindow} ngày)</div>`+list.map(c=>{
    const personsChips=c.persons.slice(0,6).map(p=>`<span class="chip">${p}</span>`).join("")+(c.persons.length>6?`<span class="chip more">+${c.persons.length-6}</span>`:"");
    return `<div class="cluster-card" onclick="jumpToStock('${c.ticker}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')jumpToStock('${c.ticker}')">
      <div class="cluster-head">
        <div class="cluster-ticker">${c.ticker}</div>
        <div class="cluster-meta">
          <div class="cluster-company">${c.company}</div>
          <div class="cluster-sub">${c.exchange} · ${c.count} insiders mua cùng nhau</div>
        </div>
        <div class="cluster-badge">Mua rổ</div>
      </div>
      <div class="cluster-persons">${personsChips}</div>
      <div class="cluster-stats">
        <span>${fmtDate(c.start)} – ${fmtDate(c.end)}</span>
        <span class="pos">+${fmtNum(c.totalShares)} cp</span>
        <span class="pos">~${fmtVal(c.totalShares,c.totalValue/c.totalShares||0)||fmtNum(c.totalValue)}</span>
      </div>
    </div>`;
  }).join("");
}

function topInsiderBuyers(n){
  const map={};
  for(const d of DATA){
    if(!d.type||!d.type.includes("buy")||!d.person)continue;
    if(!map[d.person])map[d.person]={person:d.person,role:d.role,count:0,value:0,tickers:new Set()};
    const m=map[d.person];
    m.count++;
    m.value+=(d.executed||d.shares||0)*(d.p_from||0);
    m.tickers.add(d.ticker);
  }
  return Object.values(map).sort((a,b)=>b.value-a.value).slice(0,n);
}

function largestBuys(n){
  return DATA.filter(d=>d.type&&d.type.includes("buy")&&d.executed&&d.p_from)
    .sort((a,b)=>((b.executed||b.shares)*(b.p_from||0))-((a.executed||a.shares)*(a.p_from||0)))
    .slice(0,n);
}

function renderHighlights(){
  const clusters=(CLUSTERS[clusterWindow]||[]).filter(c=>signalExchange==="all"||c.exchange===signalExchange).slice(0,5);
  const buys=largestBuys(8);
  const buyers=topInsiderBuyers(8);
  const el=document.getElementById("signals-content");
  let html=`<div class="signal-section">
    <div class="signal-section-title">&#128293; Mua rổ gần đây</div>
    ${clusters.length?clusters.map(c=>`<div class="hl-row" onclick="jumpToStock('${c.ticker}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')jumpToStock('${c.ticker}')">
      <div class="hl-main"><span class="hl-ticker">${c.ticker}</span> ${c.count} insiders · ${fmtDate(c.start)}</div>
      <div class="hl-sub">${c.persons.slice(0,3).join(", ")}${c.persons.length>3?"…":""}</div>
    </div>`).join(""):`<div class="empty-text">Chưa có</div>`}
  </div>`;
  html+=`<div class="signal-section">
    <div class="signal-section-title">&#128176; Mua ròng lớn nhất</div>
    ${buys.map(d=>feedItemHtml(d)).join("")}
  </div>`;
  html+=`<div class="signal-section">
    <div class="signal-section-title">&#127942; Top insider mua nhiều nhất (theo giá trị)</div>
    ${buyers.map(b=>`<div class="hl-row" onclick="searchPersonByName('${b.person.replace(/'/g,"\\'")}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')searchPersonByName('${b.person.replace(/'/g,"\\'")}')">
      <div class="hl-main"><span class="hl-person">${b.person}</span> <span class="hl-role">${b.role}</span></div>
      <div class="hl-sub">${b.count} giao dịch · ${[...b.tickers].slice(0,5).join(", ")} · <span class="pos">${fmtVal(1,b.value)}</span></div>
    </div>`).join("")}
  </div>`;
  el.innerHTML=html;
}
function openModal(id){
  const d=DATA.find(x=>x.id===id);
  if(!d)return;
  const isBuy=d.type.includes("buy");
  const isPending=d.executed===null;
  const badgeCls=isPending?(isBuy?"reg_buy":"reg_sell"):(isBuy?"buy":"sell");
  const badgeLabel=isPending?(isBuy?"Đăng ký mua":"Đăng ký bán"):(isBuy?"Đã mua":"Đã bán");
  const value=fmtVal(d.executed||d.shares,d.p_from);
  const pct=d.executed&&d.shares?Math.round(d.executed/d.shares*100):null;
  const p1=d.perf_1w, p1m=d.perf_1m;
  const p1txt=p1!=null?(p1>=0?"+":"")+p1+"%":null;
  const p1cls=p1!=null?(p1>=0?"pos":"neg"):"";
  const pMtxt=p1m!=null?(p1m>=0?"+":"")+p1m+"%":null;
  const pMcls=p1m!=null?(p1m>=0?"pos":"neg"):"";
  const dipNote=(d.dip!=null&&d.dip<=-5)?`<div class="modal-note dip"><span>&#9660;</span> Insider mua khi giá đã giảm <strong>${Math.abs(d.dip)}%</strong> trước giao dịch</div>`:"";

  document.getElementById("modal-content").innerHTML=`
    <div class="modal-header ${isBuy?'buy':'sell'}">
      <div class="modal-id">
        <div class="modal-ticker">${d.ticker}</div>
        <div class="modal-company">${d.company}</div>
      </div>
      <span class="modal-badge ${badgeCls}"><span class="tx-badge-dot"></span>${badgeLabel}</span>
      <button class="modal-close" onclick="closeModal()" aria-label="Đóng">&times;</button>
    </div>
    <div class="modal-body">
      <div class="modal-summary">
        <div class="ms-item"><div class="ms-label">Khối lượng</div><div class="ms-val" style="color:${isBuy?'var(--buy)':'var(--sell)'}">${isBuy?'+':'−'}${fmtNum(d.executed||d.shares)}</div></div>
        <div class="ms-item"><div class="ms-label">Giá trị</div><div class="ms-val">${value?("~"+value):"—"}</div></div>
        <div class="ms-item"><div class="ms-label">Hiệu quả 1T</div><div class="ms-val ${p1cls}">${p1txt||"—"}</div></div>
        <div class="ms-item"><div class="ms-label">Hiệu quả 1Th</div><div class="ms-val ${pMcls}">${pMtxt||"—"}</div></div>
      </div>
      ${dipNote}
      <div class="modal-rows">
        <div class="modal-row"><div class="modal-label">Người giao dịch</div><div class="modal-val modal-link" onclick="closeModal();jumpToPerson('${d.id}')">${d.person}</div></div>
        <div class="modal-row"><div class="modal-label">Vị trí</div><div class="modal-val">${d.role}</div></div>
        <div class="modal-row"><div class="modal-label">Sàn</div><div class="modal-val">${d.exchange}</div></div>
        ${d.p_from?`<div class="modal-row"><div class="modal-label">Khoảng giá</div><div class="modal-val">${fmtPrice(d.p_from)} — ${fmtPrice(d.p_to)}</div></div>`:''}
        ${d.executed?`<div class="modal-row"><div class="modal-label">Đã thực hiện</div><div class="modal-val" style="color:${isBuy?'var(--buy)':'var(--sell)'}">${fmtNum(d.executed)}${pct!==null?' ('+pct+'%)':''}</div></div>`:''}
        <div class="modal-row"><div class="modal-label">Ngày đăng ký</div><div class="modal-val">${fmtDate(d.date_reg)}</div></div>
        <div class="modal-row"><div class="modal-label">Thời gian GD</div><div class="modal-val">${fmtDate(d.date_from)} — ${fmtDate(d.date_to)}</div></div>
      </div>
      <div class="modal-actions">
        <button class="modal-cta" onclick="closeModal();jumpToStock('${d.ticker}')">Xem mã ${d.ticker} →</button>
        <button class="modal-cta ghost" onclick="closeModal();jumpToPerson('${d.id}')">Hồ sơ ${d.person.split(" ").pop()} →</button>
      </div>
    </div>`;
  document.getElementById("modal-overlay").classList.add("open");
  document.body.style.overflow="hidden";
}

function closeModal(){
  document.getElementById("modal-overlay").classList.remove("open");
  document.body.style.overflow="";
}

document.addEventListener("keydown",e=>{
  // Escape to close modal
  if(e.key==="Escape")closeModal();
  
  // Keyboard shortcuts (only when not typing in input)
  if(!e.target.closest("input,textarea,select")){
    // 1-5 = Switch tabs
    if(e.key==="1"){switchTab("feed")}
    if(e.key==="2"){switchTab("signals")}
    if(e.key==="3"){switchTab("winrate")}
    if(e.key==="4"){switchTab("stock")}
    if(e.key==="5"){switchTab("watchlist")}
    // / = Focus search
    if(e.key==="/"){
      e.preventDefault();
      switchTab("feed");
      document.getElementById("feed-search").focus();
    }
  }
});

function jumpToStock(ticker){
  switchTab("stock");
  document.getElementById("stock-input").value=ticker;
  searchStock();
}

function priceChartSVG(ticker, txs){
  if(typeof PRICES==='undefined'||!PRICES||!PRICES.series||!PRICES.series[ticker]){
    return `<div class="chart-empty">Biểu đồ giá chưa khả dụng cho ${ticker}</div>`;
  }
  const dates=PRICES.dates;
  const s=PRICES.series[ticker];
  const vals=s.filter(v=>v!=null);
  if(vals.length<2) return `<div class="chart-empty">Dữ liệu giá chưa đủ</div>`;
  const min=Math.min(...vals), max=Math.max(...vals);
  const W=720,H=260,L=48,R=12,T=14,B=26;
  const pw=W-L-R, ph=H-T-B, n=s.length;
  const X=i=>L+pw*(i/(n-1));
  const Y=v=>T+ph*(1-(v-min)/((max-min)||1));
  let pts=[];
  for(let i=0;i<n;i++){ if(s[i]!=null) pts.push(X(i).toFixed(1)+","+Y(s[i]).toFixed(1)); }
  let area=`M ${L} ${T+ph} L `+pts.join(" L ")+` L ${X(n-1).toFixed(1)} ${T+ph} Z`;
  let marks="";
  const trading=txs.filter(d=>d.type&&(d.type.includes("buy")||d.type.includes("sell"))&&(d.date_from||d.date_reg));
  for(const d of trading){
    const dt=d.date_from||d.date_reg;
    let idx=-1;
    for(let i=0;i<n;i++){ if(dates[i]<=dt) idx=i; else break; }
    if(idx<0||s[idx]==null) continue;
    const isBuy=d.type.includes("buy");
    const cx=X(idx).toFixed(1), cy=Y(s[idx]).toFixed(1);
    marks+=`<circle cx="${cx}" cy="${cy}" r="3.5" fill="${isBuy?'#10b981':'#ef4444'}" stroke="#0b0d12" stroke-width="1"><title>${d.person} - ${fmtDate(dt)}</title></circle>`;
  }
  let grid="";
  const steps=4;
  for(let i=0;i<=steps;i++){
    const v=min+(max-min)*i/steps, y=Y(v);
    grid+=`<line x1="${L}" y1="${y.toFixed(1)}" x2="${W-R}" y2="${y.toFixed(1)}" stroke="#1c2030" stroke-width="1"/>`;
    grid+=`<text x="${L-6}" y="${(y+3).toFixed(1)}" fill="#6b7280" font-size="10" text-anchor="end">${fmtPrice(v)}</text>`;
  }
  let lastIdx=n-1; while(lastIdx>0&&s[lastIdx]==null)lastIdx--;
  const lastV=s[lastIdx];
  const lastLabel=`<text x="${X(lastIdx).toFixed(1)}" y="${(Y(lastV)-8).toFixed(1)}" fill="#e5e7eb" font-size="11" text-anchor="middle">${fmtPrice(lastV)}</text>`;
  return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" class="price-chart" preserveAspectRatio="none">
    ${grid}
    <path d="${area}" fill="rgba(37,99,235,0.08)"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="#2563eb" stroke-width="1.5"/>
    ${marks}
    ${lastLabel}
  </svg>
  <div class="chart-legend"><span class="dot buy"></span>Mua nội bộ<span class="dot sell"></span>Bán nội bộ · Nguồn: KBS</div></div>`;
}

function searchStock(){
  const query=document.getElementById("stock-input").value.trim();
  if(!query)return;
  saveRecentTicker(query);
  renderRecentTickerSearches();
  const tk=query.toUpperCase();
  const txs = googleSearch(query, DATA, d => [d.ticker, d.company, d.person]);
  const result=document.getElementById("stock-result");

  if(!txs.length){
    result.innerHTML=`<div class="empty"><div class="empty-icon">&#128269;</div><div class="empty-text">Không tìm thấy giao dịch nội bộ cho mã <strong>${query}</strong></div></div>`;
    return;
  }

  const buys=txs.filter(d=>d.type==="buy");
  const sells=txs.filter(d=>d.type==="sell");
  const regBuys=txs.filter(d=>d.type==="register_buy");
  const regSells=txs.filter(d=>d.type==="register_sell");
  const totalBuy=buys.reduce((s,d)=>s+(d.executed||0),0);
  const totalSell=sells.reduce((s,d)=>s+(d.executed||0),0);
  const totalValBuy=buys.reduce((s,d)=>s+(d.executed||0)*(d.p_from||0),0);
  const totalValSell=sells.reduce((s,d)=>s+(d.executed||0)*(d.p_from||0),0);
  const company=txs[0].company;
  const exchange=txs[0].exchange;

  const sorted=[...txs].sort((a,b)=>b.date_reg.localeCompare(a.date_reg));

  result.innerHTML=`
    <div class="stock-header">
      <div class="stock-ticker-big">${query}</div>
      <div>      <div class="stock-name-big">${company}</div><div class="stock-exchange">${exchange} — 60 ngày gần nhất</div></div>
      <button class="follow-btn ${isTickerWatched(query)?'followed':''}" onclick="toggleTickerFollow('${query}');searchStock()">${isTickerWatched(query)?'Đang theo dõi':'+ Theo dõi'}</button>
    </div>
      <div class="stock-summary">
        <div class="sum-card"><div class="sum-label">Giao dịch</div><div class="sum-value">${txs.length}</div></div>
        <div class="sum-card"><div class="sum-label">CP mua ròng</div><div class="sum-value" style="color:${(totalBuy-totalSell)>=0?'var(--buy)':'var(--sell)'}">${(totalBuy-totalSell)>=0?'+':''}${fmtNum(totalBuy-totalSell)}</div></div>
        <div class="sum-card"><div class="sum-label">Giá trị mua</div><div class="sum-value">${fmtVal(1,totalValBuy)||'\u2014'}</div></div>
        <div class="sum-card"><div class="sum-label">Tín hiệu</div><div class="sum-value" style="color:${buys.length>=sells.length?'var(--buy)':'var(--sell)'}">${buys.length>=sells.length?'Mua':'Bán'}</div></div>
      </div>
      <div class="stock-chart">
        <div class="timeline-title">Biểu đồ giá &amp; giao dịch nội bộ</div>
        ${priceChartSVG(tk, txs)}
      </div>
    <div class="stock-timeline">
      <div class="timeline-title">Lịch sử giao dịch</div>
      <div class="timeline-list">
        ${sorted.map(d=>{
          const cfg=TX_CONFIG[d.type];
          const isBuy=d.type.includes("buy");
          const isPending=d.executed===null;
          const badgeLabel=isPending?(isBuy?"Đăng ký mua":"Đăng ký bán"):(isBuy?"Đã mua":"Đã bán");
          const badgeCls=isPending?(isBuy?"reg_buy":"reg_sell"):(isBuy?"buy":"sell");
          const value=fmtVal(d.executed||d.shares,d.p_from);
          return `<div class="timeline-item">
            <div class="timeline-dot ${isBuy?'buy':'sell'}"></div>
            <div class="timeline-date">${fmtDate(d.date_reg)}</div>
            <div class="timeline-content">
              <strong>${d.person}</strong> (${d.role}) - ${badgeLabel}<br>
              ${fmtNum(d.executed||d.shares)} CP${value?' ~'+value+' VND':''}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>
    <div class="tx-list">
      ${txs.map(d=>{
        const isBuy=d.type.includes("buy");
        const isPending=d.executed===null;
        const badgeCls=isPending?(isBuy?"reg_buy":"reg_sell"):(isBuy?"buy":"sell");
        const badgeLabel=isPending?(isBuy?"Đăng ký mua":"Đăng ký bán"):(isBuy?"Đã mua":"Đã bán");
        const value=fmtVal(d.executed||d.shares,d.p_from);
        return `<div class="tx-item ${isBuy?'buy':'sell'}" onclick="openModal('${d.id}')">
          <div class="tx-ticker">${d.ticker}</div>
          <div class="tx-main"><div class="tx-company">${d.person}</div><span class="tx-role ${d.roleKey}">${d.role}</span></div>
          <div class="tx-badge ${badgeCls}"><div class="tx-badge-dot"></div>${badgeLabel}</div>
          <div class="tx-numbers">
            <div class="tx-shares" style="color:${isBuy?'var(--buy)':'var(--sell)'}">${isBuy?'+':'-'}${fmtNum(d.executed||d.shares)}</div>
            ${value?'<div class="tx-value">~'+value+'</div>':''}
            <div class="tx-date">${fmtDate(d.date_reg)}</div>
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

let currentSearchMode="ticker";
function switchSearchMode(mode){
  currentSearchMode=mode;
  document.getElementById("mode-ticker").classList.toggle("active",mode==="ticker");
  document.getElementById("mode-person").classList.toggle("active",mode==="person");
  document.getElementById("search-ticker-mode").style.display=mode==="ticker"?"":"none";
  document.getElementById("search-person-mode").style.display=mode==="person"?"":"none";
  document.getElementById("stock-result").innerHTML="";
  if(mode==="ticker")renderRecentTickerSearches();
  else renderRecentPersonSearches();
}

function searchPerson(){
  const query=document.getElementById("person-input").value.trim();
  if(!query)return;
  saveRecentPerson(query);
  renderRecentPersonSearches();
  const txs = googleSearch(query, DATA, d => [d.person, d.company, d.ticker, d.role]);
  const result=document.getElementById("stock-result");

  if(!txs.length){
    result.innerHTML=`<div class="empty"><div class="empty-icon">&#128100;</div><div class="empty-text">Không tìm thấy giao dịch của "<strong>${query}</strong>"</div></div>`;
    return;
  }

  const persons=[...new Set(txs.map(d=>d.person))];
  if(persons.length===1){
    renderPersonProfile(persons[0],txs);
  } else {
    result.innerHTML=`<div class="person-list">${persons.map(p=>{
      const count=txs.filter(d=>d.person===p).length;
      const isFollowed=isPersonFollowed(p);
      return `<div class="person-card" onclick="renderPersonProfile('${p.replace(/'/g,"\\'")}',DATA.filter(d=>d.person==='${p.replace(/'/g,"\\'")}'))" onkeydown="if(event.key==='Enter'||event.key===' ')renderPersonProfile('${p.replace(/'/g,"\\'")}',DATA.filter(d=>d.person==='${p.replace(/'/g,"\\'")}'))" role="button" tabindex="0">
        <div class="person-avatar">${p.charAt(0)}</div>
        <div class="person-info"><div class="person-name">${p}</div><div class="person-count">${count} giao dịch</div></div>
        <button class="follow-btn ${isFollowed?'followed':''}" onclick="event.stopPropagation();toggleFollow('${p.replace(/'/g,"\\'")}')">
          ${isFollowed?'Đang theo dõi':'+ Theo dõi'}
        </button>
      </div>`;
    }).join("")}</div>`;
  }
}

function renderPersonProfile(person,txs){
  if(!txs)txs=DATA.filter(d=>d.person===person);
  const result=document.getElementById("stock-result");
  const isFollowed=isPersonFollowed(person);
  const buys=txs.filter(d=>d.type==="buy");
  const sells=txs.filter(d=>d.type==="sell");
  const tickers=[...new Set(txs.map(d=>d.ticker))];
  const totalBuy=buys.reduce((s,d)=>s+(d.executed||0),0);
  const totalSell=sells.reduce((s,d)=>s+(d.executed||0),0);
  const sorted=[...txs].sort((a,b)=>b.date_reg.localeCompare(a.date_reg));

  result.innerHTML=`
    <div class="person-profile">
      <div class="person-profile-header">
        <div class="person-avatar large">${person.charAt(0)}</div>
        <div class="person-profile-info">
          <div class="person-profile-name">${person}</div>
          <div class="person-profile-stats">
            <span>${txs.length} giao dịch</span>
            <span>•</span>
            <span>${tickers.length} mã CP</span>
          </div>
        </div>
        <button class="follow-btn large ${isFollowed?'followed':''}" onclick="toggleFollow('${person.replace(/'/g,"\\'")}');renderPersonProfile('${person.replace(/'/g,"\\'")}')">
          ${isFollowed?'Đang theo dõi':'+ Theo dõi'}
        </button>
      </div>
      <div class="stock-summary">
        <div class="sum-card"><div class="sum-label">Mã CP</div><div class="sum-value">${tickers.join(", ")}</div></div>
        <div class="sum-card"><div class="sum-label">CP mua ròng</div><div class="sum-value" style="color:${(totalBuy-totalSell)>=0?'var(--buy)':'var(--sell)'}">${(totalBuy-totalSell)>=0?'+':''}${fmtNum(totalBuy-totalSell)}</div></div>
        <div class="sum-card"><div class="sum-label">Mua/Bán</div><div class="sum-value" style="color:${buys.length>=sells.length?'var(--buy)':'var(--sell)'}">${buys.length}/${sells.length}</div></div>
      </div>
      <div class="tx-list">
        ${sorted.map(d=>{
          const isBuy=d.type.includes("buy");
          const isPending=d.executed===null;
          const badgeCls=isPending?(isBuy?"reg_buy":"reg_sell"):(isBuy?"buy":"sell");
          const badgeLabel=isPending?(isBuy?"Đăng ký mua":"Đăng ký bán"):(isBuy?"Đã mua":"Đã bán");
          const value=fmtVal(d.executed||d.shares,d.p_from);
        return `<div class="tx-item ${isBuy?'buy':'sell'}" onclick="openModal('${d.id}')" onkeydown="if(event.key==='Enter'||event.key===' ')openModal('${d.id}')" role="button" tabindex="0">
            <div class="tx-ticker">${d.ticker}</div>
            <div class="tx-main"><div class="tx-company">${d.company}</div><span class="tx-role ${d.roleKey}">${d.role}</span></div>
            <div class="tx-badge ${badgeCls}"><div class="tx-badge-dot"></div>${badgeLabel}</div>
            <div class="tx-numbers">
              <div class="tx-shares" style="color:${isBuy?'var(--buy)':'var(--sell)'}">${isBuy?'+':'-'}${fmtNum(d.executed||d.shares)}</div>
              ${value?'<div class="tx-value">~'+value+'</div>':''}
              <div class="tx-date">${fmtDate(d.date_reg)}</div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
}

function getFollowedPeople(){
  try{return JSON.parse(localStorage.getItem("insider_followed")||"[]")}catch(e){return[]}
}
function saveFollowedPeople(list){localStorage.setItem("insider_followed",JSON.stringify(list))}
function isPersonFollowed(person){return getFollowedPeople().includes(person)}
function toggleFollow(person){
  let list=getFollowedPeople();
  if(list.includes(person)){list=list.filter(p=>p!==person);showToast("Đã bỏ theo dõi")}
  else{list.push(person);showToast("Đã thêm vào danh sách theo dõi")}
  saveFollowedPeople(list);
  renderFollowedSection();
}
function renderFollowedSection(){
  const list=getFollowedPeople();
  const section=document.getElementById("followed-section");
  const countEl=document.getElementById("followed-count");
  const listEl=document.getElementById("followed-list");
  if(!section)return;
  if(!list.length){section.style.display="none";return}
  section.style.display="";
  countEl.textContent=list.length+" người";
  listEl.innerHTML=list.map(p=>{
    const txs=DATA.filter(d=>d.person===p);
    const latest=txs.sort((a,b)=>b.date_reg.localeCompare(a.date_reg))[0];
    return `<div class="followed-item" onclick="renderPersonProfile('${p.replace(/'/g,"\\'")}')" onkeydown="if(event.key==='Enter'||event.key===' ')renderPersonProfile('${p.replace(/'/g,"\\'")}')" role="button" tabindex="0">
      <div class="followed-avatar">${p.charAt(0)}</div>
      <div class="followed-info">
        <div class="followed-name">${p}</div>
        <div class="followed-latest">${latest?latest.ticker+' • '+fmtDate(latest.date_reg):'Chưa có GD'}</div>
      </div>
      <button class="follow-remove" onclick="event.stopPropagation();toggleFollow('${p.replace(/'/g,"\\'")}')">&times;</button>
    </div>`;
  }).join("");
}

function toggleCheck(el){el.classList.toggle("checked")}

function submitAlert(){
  const tg=document.getElementById("tg-input").value.trim();
  const wl=document.getElementById("watchlist-input").value.trim();
  if(!tg){showToast("Vui lòng nhập Telegram ID",false);return}
  showToast("Đã đăng ký cảnh báo thành công!");
}

function showToast(msg,ok=true){
  const t=document.getElementById("toast");
  document.getElementById("toast-msg").textContent=msg;
  t.style.borderColor=ok?"var(--buy)":"var(--sell)";
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),3000);
}

const WL_PEOPLE_KEY="insider_watchlist_people";
const WL_TICKERS_KEY="insider_watchlist_tickers";
function getWatchlistPeople(){try{return JSON.parse(localStorage.getItem(WL_PEOPLE_KEY)||"[]")}catch(e){return[]}}
function saveWatchlistPeople(list){localStorage.setItem(WL_PEOPLE_KEY,JSON.stringify(list))}
function getWatchlistTickers(){try{return JSON.parse(localStorage.getItem(WL_TICKERS_KEY)||"[]")}catch(e){return[]}}
function saveWatchlistTickers(list){localStorage.setItem(WL_TICKERS_KEY,JSON.stringify(list))}
function isPersonWatched(p){return getWatchlistPeople().includes(p)}
function isTickerWatched(t){return getWatchlistTickers().includes(t)}

function addPersonToWatchlist(){
  const input=document.getElementById("wl-add-person");
  const name=input.value.trim();
  if(!name){showToast("Nhập tên lãnh đạo",false);return}
  const match=DATA.find(d=>d.person.toLowerCase().includes(name.toLowerCase()));
  if(!match){showToast("Không tìm thấy '"+name+"'",false);return}
  const fullName=match.person;
  let list=getWatchlistPeople();
  if(list.includes(fullName)){showToast("Đã có trong danh sách",false);return}
  list.push(fullName);
  saveWatchlistPeople(list);
  input.value="";
  showToast("Đã thêm "+fullName);
  renderWatchlist();
}

function addTickerToWatchlist(){
  const input=document.getElementById("wl-add-ticker");
  const ticker=input.value.trim().toUpperCase();
  if(!ticker){showToast("Nhập mã CP",false);return}
  if(!DATA.find(d=>d.ticker===ticker)){showToast("Không tìm thấy mã "+ticker,false);return}
  let list=getWatchlistTickers();
  if(list.includes(ticker)){showToast("Đã có trong danh sách",false);return}
  list.push(ticker);
  saveWatchlistTickers(list);
  input.value="";
  showToast("Đã thêm "+ticker);
  renderWatchlist();
}

function removePersonFromWatchlist(name){
  let list=getWatchlistPeople().filter(p=>p!==name);
  saveWatchlistPeople(list);
  renderWatchlist();
}

function removeTickerFromWatchlist(ticker){
  let list=getWatchlistTickers().filter(t=>t!==ticker);
  saveWatchlistTickers(list);
  renderWatchlist();
}

function toggleSection(type){
  const el=document.getElementById(type==="people"?"wl-people-list":"wl-tickers-list");
  const btn=el.previousElementSibling.querySelector(".wl-section-toggle");
  if(el.style.display==="none"){el.style.display="";btn.textContent="Thu gọn"}
  else{el.style.display="none";btn.textContent="Mở rộng"}
}

function renderWatchlist(){
  const peopleList=getWatchlistPeople();
  const tickersList=getWatchlistTickers();
  const isEmpty=!peopleList.length&&!tickersList.length;

  document.getElementById("wl-empty").style.display=isEmpty?"":"none";
  document.getElementById("wl-people-section").style.display=peopleList.length?"":"none";
  document.getElementById("wl-tickers-section").style.display=tickersList.length?"":"none";

  document.getElementById("wl-people-count").textContent=peopleList.length;
  document.getElementById("wl-ticker-count").textContent=tickersList.length;

  let allTx=[];
  peopleList.forEach(p=>{allTx=allTx.concat(DATA.filter(d=>d.person===p))});
  tickersList.forEach(t=>{allTx=allTx.concat(DATA.filter(d=>d.ticker===t))});

  document.getElementById("wl-trade-count").textContent=allTx.length;
  const buys=allTx.filter(d=>d.type==="buy").length;
  const sells=allTx.filter(d=>d.type==="sell").length;
  document.getElementById("wl-signal").textContent=buys>sells?"Mua":buys<sells?"Bán":"Cân bằng";
  document.getElementById("wl-signal").style.color=buys>sells?"var(--buy)":buys<sells?"var(--sell)":"var(--muted)";

  document.getElementById("wl-people-list").innerHTML=peopleList.length?peopleList.map(p=>{
    const txs=DATA.filter(d=>d.person===p);
    const tickers=[...new Set(txs.map(d=>d.ticker))];
    return `<div class="wl-person-item" onclick="renderPersonProfile('${p.replace(/'/g,"\\'")}');switchTab('stock')" onkeydown="if(event.key==='Enter'||event.key===' '){renderPersonProfile('${p.replace(/'/g,"\\'")}');switchTab('stock')}" role="button" tabindex="0">
      <div class="wl-person-avatar">${p.charAt(0)}</div>
      <div class="wl-person-info">
        <div class="wl-person-name">${p}</div>
        <div class="wl-person-tickers">${tickers.join(", ")||"Chưa có GD"}</div>
      </div>
      <div class="wl-person-actions">
        <span class="wl-person-count">${txs.length} GD</span>
        <button class="wl-remove-btn" onclick="event.stopPropagation();removePersonFromWatchlist('${p.replace(/'/g,"\\'")}')">&times;</button>
      </div>
    </div>`;
  }).join(""):"<div style='padding:20px;text-align:center;color:var(--muted);font-size:13px'>Chưa theo dõi lãnh đạo nào</div>";

  document.getElementById("wl-tickers-list").innerHTML=tickersList.length?tickersList.map(t=>{
    const txs=DATA.filter(d=>d.ticker===t);
    const buys=txs.filter(d=>d.type==="buy").length;
    const sells=txs.filter(d=>d.type==="sell").length;
    const signal=buys>sells?"buy":buys<sells?"sell":"neutral";
    const signalText=buys>sells?"Mua":buys<sells?"Bán":"TB";
    const company=txs[0]?txs[0].company:"";
    return `<div class="wl-ticker-item" onclick="jumpToStock('${t}')" onkeydown="if(event.key==='Enter'||event.key===' ')jumpToStock('${t}')" role="button" tabindex="0">
      <div class="wl-ticker-symbol">${t}</div>
      <div class="wl-ticker-info">
        <div class="wl-ticker-name">${company}</div>
        <div class="wl-ticker-exchange">${txs.length} giao dịch</div>
      </div>
      <span class="wl-ticker-signal ${signal}">${signalText}</span>
      <button class="wl-remove-btn" onclick="event.stopPropagation();removeTickerFromWatchlist('${t}')">&times;</button>
    </div>`;
  }).join(""):"<div style='padding:20px;text-align:center;color:var(--muted);font-size:13px'>Chưa theo dõi mã CP nào</div>";

  const recentTx=allTx.sort((a,b)=>b.date_reg.localeCompare(a.date_reg)).slice(0,10);
  document.getElementById("wl-recent-trades").innerHTML=recentTx.length?recentTx.map(d=>{
    const isBuy=d.type.includes("buy");
    const isPending=d.executed===null;
    const badgeLabel=isPending?(isBuy?"Đăng ký mua":"Đăng ký bán"):(isBuy?"Đã mua":"Đã bán");
    return `<div class="wl-recent-item" onclick="openModal('${d.id}')" onkeydown="if(event.key==='Enter'||event.key===' ')openModal('${d.id}')" role="button" tabindex="0">
      <div class="wl-recent-badge ${isBuy?'buy':'sell'}"></div>
      <div class="wl-recent-info">
        <div class="wl-recent-main"><strong>${d.ticker}</strong> — ${d.person}</div>
        <div class="wl-recent-detail">${badgeLabel} • ${fmtNum(d.executed||d.shares)} CP</div>
      </div>
      <div class="wl-recent-date">${fmtDate(d.date_reg)}</div>
    </div>`;
  }).join(""):"<div style='padding:20px;text-align:center;color:var(--muted);font-size:13px'>Chưa có giao dịch</div>";
}

// Export watchlist to CSV
function exportWatchlist(){
  const peopleList=getWatchlistPeople();
  const tickersList=getWatchlistTickers();
  let allTx=[];
  peopleList.forEach(p=>{allTx=allTx.concat(DATA.filter(d=>d.person===p))});
  tickersList.forEach(t=>{allTx=allTx.concat(DATA.filter(d=>d.ticker===t))});
  
  if(!allTx.length){
    showToast("Không có dữ liệu để xuất");
    return;
  }
  
  const headers=["Mã CP","Công ty","Người","Vị trí","Loại GD","Số lượng CP","Giá từ","Giá đến","Ngày đăng ký","Sàn"];
  const rows=allTx.map(d=>[
    d.ticker,
    d.company,
    d.person,
    d.role,
    d.type==="buy"?"Mua":d.type==="sell"?"Bán":d.type==="register_buy"?"Đăng ký mua":"Đăng ký bán",
    d.executed||d.shares,
    d.p_from||"",
    d.p_to||"",
    d.date_reg,
    d.exchange
  ]);
  
  const csv=[headers,...rows].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const link=document.createElement("a");
  link.href=URL.createObjectURL(blob);
  link.download=`insidervn-watchlist-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  showToast("Đã xuất file CSV");
}

function toggleFollow(person){
  let list=getWatchlistPeople();
  if(list.includes(person)){list=list.filter(p=>p!==person);showToast("Đã bỏ theo dõi")}
  else{list.push(person);showToast("Đã thêm vào danh sách theo dõi")}
  saveWatchlistPeople(list);
  renderFollowedSection();
}

function toggleTickerFollow(ticker){
  let list=getWatchlistTickers();
  if(list.includes(ticker)){list=list.filter(t=>t!==ticker);showToast("Đã bỏ theo dõi "+ticker)}
  else{list.push(ticker);showToast("Đã thêm "+ticker+" vào danh sách")}
  saveWatchlistTickers(list);
}

function isPersonFollowed(p){return isPersonWatched(p)}

// Recently viewed functionality
const RECENT_KEY="insidervn_recently_viewed";
function getRecentlyViewed(){
  try{return JSON.parse(localStorage.getItem(RECENT_KEY))||[]}catch(e){return[]}
}
function addRecentlyViewed(id){
  let list=getRecentlyViewed();
  list=list.filter(x=>x!==id);
  list.unshift(id);
  if(list.length>10)list=list.slice(0,10);
  localStorage.setItem(RECENT_KEY,JSON.stringify(list));
}
function renderRecentlyViewed(){
  const list=getRecentlyViewed();
  const container=document.getElementById("recently-viewed");
  if(!container||!list.length)return;
  const items=list.map(id=>DATA.find(d=>d.id===id)).filter(Boolean).slice(0,5);
  container.innerHTML=items.length?`<div class="recently-viewed-title">Đã xem gần đây</div>
    <div class="recently-viewed-list">${items.map(d=>{
      const isBuy=d.type.includes("buy");
      return `<div class="recently-viewed-item" onclick="openModal('${d.id}')" role="button" tabindex="0">
        <div class="rv-ticker">${d.ticker}</div>
        <div class="rv-info"><div class="rv-person">${d.person}</div><div class="rv-date">${fmtDate(d.date_reg)}</div></div>
        <div class="rv-badge ${isBuy?'buy':'sell'}">${isBuy?'Mua':'Bán'}</div>
      </div>`;
    }).join("")}</div>`:"";
}

// Search by person name from feed
function searchPersonByName(name){
  switchTab("stock");
  switchSearchMode("person");
  document.getElementById("person-input").value=name;
  searchPerson();
}
function jumpToPerson(id){
  const rec=DATA.find(d=>String(d.id)===String(id));
  if(rec) searchPersonByName(rec.person);
}

// Autocomplete suggestions
const TICKER_SUGGESTIONS_KEY="insidervn_recent_tickers";
const PERSON_SUGGESTIONS_KEY="insidervn_recent_persons";

function getRecentTickers(){
  try{return JSON.parse(localStorage.getItem(TICKER_SUGGESTIONS_KEY))||[]}catch(e){return[]}
}
function saveRecentTicker(ticker){
  let list=getRecentTickers();
  list=list.filter(t=>t!==ticker);
  list.unshift(ticker);
  if(list.length>8)list=list.slice(0,8);
  localStorage.setItem(TICKER_SUGGESTIONS_KEY,JSON.stringify(list));
}
function getRecentPersons(){
  try{return JSON.parse(localStorage.getItem(PERSON_SUGGESTIONS_KEY))||[]}catch(e){return[]}
}
function saveRecentPerson(person){
  let list=getRecentPersons();
  list=list.filter(p=>p!==person);
  list.unshift(person);
  if(list.length>8)list=list.slice(0,8);
  localStorage.setItem(PERSON_SUGGESTIONS_KEY,JSON.stringify(list));
}

function showTickerSuggestions(){
  const input=document.getElementById("stock-input");
  const dropdown=document.getElementById("ticker-suggestions");
  const query=input.value.trim();
  if(!query||query.length<1){dropdown.style.display="none";return}
  
  const uniqueTickers=[...new Set(DATA.map(d=>d.ticker))];
  const matches=googleSearch(query, uniqueTickers.map(t=>({ticker:t,company:DATA.find(d=>d.ticker===t)?.company||""})), d=>[d.ticker,d.company]).slice(0,8);
  if(!matches.length){dropdown.style.display="none";return}
  
  dropdown.innerHTML=matches.map(m=>{
    return `<div class="suggestion-item" onclick="selectTicker('${m.ticker}')">
      <div class="suggestion-ticker">${m.ticker}</div>
      <div class="suggestion-company">${m.company}</div>
    </div>`;
  }).join("");
  dropdown.style.display="block";
}

function selectTicker(ticker){
  document.getElementById("stock-input").value=ticker;
  document.getElementById("ticker-suggestions").style.display="none";
  saveRecentTicker(ticker);
  renderRecentTickerSearches();
  searchStock();
}

function showPersonSuggestions(){
  const input=document.getElementById("person-input");
  const dropdown=document.getElementById("person-suggestions");
  const query=input.value.trim();
  if(!query||query.length<1){dropdown.style.display="none";return}
  
  const uniquePersons=[...new Set(DATA.map(d=>d.person))];
  const matches=googleSearch(query, uniquePersons.map(p=>({person:p, tickers:[...new Set(DATA.filter(d=>d.person===p).map(d=>d.ticker))].join(", ")})), d=>[d.person,d.tickers]).slice(0,8);
  if(!matches.length){dropdown.style.display="none";return}
  
  dropdown.innerHTML=matches.map(m=>{
    return `<div class="suggestion-item" onclick="selectPerson('${m.person.replace(/'/g,"\\'")}')">
      <div class="suggestion-person">${m.person}</div>
      <div class="suggestion-tickers">${m.tickers}</div>
    </div>`;
  }).join("");
  dropdown.style.display="block";
}

function selectPerson(person){
  document.getElementById("person-input").value=person;
  document.getElementById("person-suggestions").style.display="none";
  saveRecentPerson(person);
  renderRecentPersonSearches();
  searchPerson();
}

function renderRecentTickerSearches(){
  const list=getRecentTickers();
  const container=document.getElementById("recent-ticker-searches");
  if(!container||!list.length)return;
  container.innerHTML=`<div class="recent-label">Tìm gần đây</div>
    <div class="recent-chips">${list.map(t=>`<button class="recent-chip" onclick="selectTicker('${t}')">${t}</button>`).join("")}</div>`;
}

function renderRecentPersonSearches(){
  const list=getRecentPersons();
  const container=document.getElementById("recent-person-searches");
  if(!container||!list.length)return;
  container.innerHTML=`<div class="recent-label">Tìm gần đây</div>
    <div class="recent-chips">${list.map(p=>`<button class="recent-chip" onclick="selectPerson('${p.replace(/'/g,"\\'")}')">${p.split(" ").pop()}</button>`).join("")}</div>`;
}

// Hide suggestions on click outside
document.addEventListener("click",e=>{
  if(!e.target.closest("#stock-input")&&!e.target.closest("#ticker-suggestions")){
    document.getElementById("ticker-suggestions").style.display="none";
  }
  if(!e.target.closest("#person-input")&&!e.target.closest("#person-suggestions")){
    document.getElementById("person-suggestions").style.display="none";
  }
  if(!e.target.closest("#cmdk"))closeCmdk();
});

/* ============ COMMAND PALETTE (⌘K) ============ */
let cmdkItems=[]; let cmdkIndex=0;
function openCmdk(){
  const o=document.getElementById("cmdk");
  o.classList.add("open"); o.setAttribute("aria-hidden","false");
  const i=document.getElementById("cmdk-input"); i.value=""; renderCmdk();
  setTimeout(()=>i.focus(),20);
}
function closeCmdk(){
  const o=document.getElementById("cmdk");
  if(!o)return;
  o.classList.remove("open"); o.setAttribute("aria-hidden","true");
}
function renderCmdk(){
  const i=document.getElementById("cmdk-input");
  const q=(i?i.value:"").trim().toLowerCase();
  const items=[];
  const actions=[["feed","Bảng tin"],["signals","Tín hiệu"],["winrate","Xếp hạng Win Rate"],["stock","Tra mã"],["watchlist","Theo dõi"]];
  actions.forEach(([k,label])=>{ if(!q||label.toLowerCase().includes(q)) items.push({label:"Đến: "+label,sub:"Tab",go:()=>switchTab(k)}); });
  if(!q||"cụm mua rổ cluster".includes(q)) items.push({label:"Tín hiệu: Cụm mua rổ",sub:"Tín hiệu",go:()=>{switchTab("signals");setSignalView("cluster",{classList:{add(){},remove(){}}});}});
  if(!q||"mua khi giảm dip".includes(q)) items.push({label:"Tín hiệu: Mua khi giảm",sub:"Tín hiệu",go:()=>{switchTab("signals");setSignalView("dip",{classList:{add(){},remove(){}}});}});
  if(q){
    let tk=0; for(const t in TICKER_MAP){ const m=TICKER_MAP[t]; if(m.ticker.toLowerCase().includes(q)||(m.company||"").toLowerCase().includes(q)){ items.push({label:m.ticker+" — "+(m.company||""),sub:"Mã",go:()=>jumpToStock(m.ticker)}); if(++tk>=8)break; } }
    let pn=0; for(const p in PERSON_INDEX){ if(p.toLowerCase().includes(q)){ items.push({label:p,sub:"Người · "+(PERSON_INDEX[p]||""),go:()=>searchPersonByName(p)}); if(++pn>=6)break; } }
  }
  cmdkItems=items.slice(0,16);
  cmdkIndex=0;
  const box=document.getElementById("cmdk-results");
  if(!cmdkItems.length){ box.innerHTML='<div class="cmdk-empty">Không tìm thấy kết quả</div>'; return; }
  box.innerHTML=cmdkItems.map((it,idx)=>`<button class="cmdk-item${idx===0?" active":""}" onmouseenter="cmdkHover(${idx})" onclick="cmdkSelect(${idx})"><span class="cmdk-item-label">${it.label}</span><span class="cmdk-item-sub">${it.sub}</span></button>`).join("");
}
function cmdkHover(idx){
  cmdkIndex=idx;
  document.querySelectorAll(".cmdk-item").forEach((el,i)=>el.classList.toggle("active",i===idx));
}
function cmdkSelect(idx){
  const it=cmdkItems[idx];
  if(!it)return;
  closeCmdk();
  it.go();
}
function cmdkKeydown(e){
  if(e.key==="ArrowDown"){e.preventDefault();cmdkIndex=Math.min(cmdkItems.length-1,cmdkIndex+1);cmdkHover(cmdkIndex);}
  else if(e.key==="ArrowUp"){e.preventDefault();cmdkIndex=Math.max(0,cmdkIndex-1);cmdkHover(cmdkIndex);}
  else if(e.key==="Enter"){e.preventDefault();cmdkSelect(cmdkIndex);}
  else if(e.key==="Escape"){e.preventDefault();closeCmdk();}
}
document.addEventListener("keydown",e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCmdk();}
  if(e.key==="Escape")closeCmdk();
});

// Track viewed items
const originalOpenModal=window.openModal;
window.openModal=function(id){
  addRecentlyViewed(id);
  originalOpenModal(id);
};

buildClusters();
renderFeed();
renderWatchlist();