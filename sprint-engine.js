/* Pure planning rules; no network requests or learning-data mutations. */
(() => {
  const addDays=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
  function remaining(task,record={}) {
    if(record.status==='done')return 0;
    if(record.status==='verify')return 30;
    const estimate=Number.isFinite(record.estimate)?record.estimate:task.minutes;
    return Math.max(0,estimate-(Number(record.completedMinutes)||0));
  }
  function budget(date,config) {
    const event=(config.events||[]).filter(e=>e.from<=date&&e.to>=date).at(-1);
    const total=Math.round(60*(event?event.hours:config.hours));
    const algo=Math.min(config.algoMinutes??90,total);
    const theory=Math.min(config.theoryMinutes??30,Math.max(0,total-algo));
    return {total,algo,theory,project:Math.max(0,total-algo-theory)};
  }
  function plan(tasks,records,config,from) {
    if(!validDate(from)||!validDate(config.deadline))throw Error('日期无效');
    const end=addDays(config.deadline,90),days=[];
    for(let d=from;d<=end;d=addDays(d,1))days.push({date:d,...budget(d,config),items:[]});
    const left=new Map(tasks.map(t=>[t.id,remaining(t,records[t.id])]));
    const finished=new Set(tasks.filter(t=>left.get(t.id)===0).map(t=>t.id));
    let lastProject='M';const completedOn={};
    for(const day of days){let room=day.project;
      while(room>0){
        const ready=tasks.filter(t=>!finished.has(t.id)&&t.deps.every(id=>finished.has(id))&&(!records[t.id]?.resumeOn||records[t.id].resumeOn<=day.date));
        ready.sort((a,b)=>a.due.localeCompare(b.due)||(a.project===lastProject?1:0)-(b.project===lastProject?1:0)||a.order-b.order);
        const task=ready[0];if(!task)break;
        const minutes=Math.min(room,left.get(task.id));if(minutes<=0)break;
        day.items.push({id:task.id,minutes});room-=minutes;left.set(task.id,left.get(task.id)-minutes);lastProject=task.project;
        if(left.get(task.id)===0){finished.add(task.id);completedOn[task.id]=day.date;}
      }
    }
    const unfinished=tasks.filter(t=>!finished.has(t.id)).map(t=>t.id);
    const late=tasks.filter(t=>completedOn[t.id]>config.deadline).map(t=>t.id);
    const extra=tasks.reduce((sum,t)=>sum+days.filter(d=>d.date>config.deadline).flatMap(d=>d.items).filter(x=>x.id===t.id).reduce((a,x)=>a+x.minutes,0),0);
    return {days:days.filter(d=>d.date<=config.deadline||d.items.length),completedOn,late,unfinished,extraMinutes:extra,finish:Object.values(completedOn).sort().at(-1)||null,remainingMinutes:tasks.reduce((s,t)=>s+remaining(t,records[t.id]),0)};
  }
  function validateAdjustment(input,start,end){
    if(!validDate(input.from)||!validDate(input.to)||input.from>input.to||input.from<start||input.to>end)throw Error('请选择计划范围内的起止日期，结束不能早于开始。');
    if(!Number.isFinite(input.hours)||input.hours<0||input.hours>12)throw Error('每天可用时间请填写 0—12 小时。');
    if(!String(input.reason||'').trim())throw Error('请简单写下调整原因。');
    return input;
  }
  window.SprintEngine={addDays,validDate,remaining,budget,plan,validateAdjustment};
})();
