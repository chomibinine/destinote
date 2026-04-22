/**
 * Destinote Oracle Engine 19.0 (Standard SaaS)
 * - CONFIG / RULES Constants
 * - Event-Driven State Pipeline
 */

export const MYSTIC_CONFIG = {
    baseWeights: [1.2, 2.0, 1.2, 3.5, 1.5, 2.0, 1.2, 1.0], 
    clashPenalty: 0.6, 
    touganMul: { primary: 1.5, middle: 1.2, initial: 1.1 },
    jongThreshold: 0.22, 
    opThreshold: 0.70  
};

export const RULES = {
    SAMHAP: { FIRE: ['寅', '午', '戌'], WATER: ['申', '子', '辰'], WOOD: ['亥', '卯', '미'], METAL: ['巳', '酉', '丑'] },
    SEASON_APPROVAL: { FIRE: ['巳','午','未','寅','戌'], WATER: ['亥','子','丑','申','辰'], WOOD: ['寅','卯','辰','亥','未'], METAL: ['申','酉','戌','巳','丑'] },
    CLASH: [['子','午'], ['丑','未'], ['寅','申'], ['卯','酉'], ['辰','戌'], ['巳','亥']],
    WONJIN: ['子未','丑午','寅酉','卯申','辰亥','巳戌','午丑','未子','申卯','酉寅','戌巳','亥辰'],
    GWIMUN: ['子酉','丑午','寅未','卯申','辰亥','巳戌','酉子','午丑','未寅','申卯','亥辰','戌巳'],
    BAEKHO: ['甲辰','乙未','丙戌','丁丑','戊辰','壬戌','癸丑'],
    SAMHYUNG: [['寅','巳','申'], ['丑','戌','未']],
    JG: {'子':['壬','癸'], '丑':['癸','辛','己'], '寅':['戊','丙','甲'], '卯':['甲','乙'], '辰':['乙','癸','戊'], '巳':['戊','庚','丙'], '午':['丙','己','丁'], '未':['丁','乙','己'], '申':['戊','壬','庚'], '酉':['庚','辛'], '戌':['辛','丁','戊'], '亥':['戊','甲','壬']}
};

export const CoreHelper = {
    getOh: (c) => {
        if('甲乙寅卯'.includes(c)) return '木'; if('丙丁巳午'.includes(c)) return '火';
        if('戊己辰戌丑未'.includes(c)) return '土'; if('庚辛申酉'.includes(c)) return '金';
        if('壬癸亥子'.includes(c)) return '水'; return '';
    },
    getSeasonMultiplier: (el, monthBranch) => {
        const weights = {
            '寅':{'木':1.8, '火':1.2, '土':0.8, '金':0.5, '水':1.0}, '卯':{'木':2.0, '火':1.2, '土':0.5, '金':0.5, '水':1.0}, '辰':{'木':1.2, '火':1.0, '土':1.5, '金':1.0, '水':0.8},
            '巳':{'木':0.8, '火':1.8, '土':1.2, '金':0.8, '水':0.5}, '午':{'木':0.8, '火':2.0, '土':1.5, '金':0.5, '水':0.5}, '未':{'木':0.5, '火':1.2, '土':1.8, '金':1.0, '水':0.5},
            '申':{'木':0.5, '火':0.8, '土':1.0, '金':1.8, '水':1.2}, '酉':{'木':0.5, '火':0.5, '土':1.0, '金':2.0, '水':1.0}, '戌':{'木':0.5, '火':0.8, '土':1.5, '金':1.2, '水':0.5},
            '亥':{'木':1.2, '火':0.5, '土':0.8, '金':1.0, '水':1.8}, '子':{'木':1.0, '火':0.5, '土':0.5, '金':1.0, '水':2.0}, '丑':{'木':0.8, '火':0.5, '土':1.5, '金':1.2, '水':1.0}
        };
        return (weights[monthBranch] && weights[monthBranch][el]) ? weights[monthBranch][el] : 1.0;
    },
    getTongGeunStrength: (stem, branches) => {
        let sc = 0; const sOh = CoreHelper.getOh(stem);
        branches.forEach((b, idx) => {
            if(!RULES.JG[b]) return;
            const jg = RULES.JG[b];
            let weight = (idx === 1) ? 2 : 1; 
            if(jg[jg.length-1] === stem) sc += (3 * weight); 
            else if(jg.includes(stem)) sc += (1 * weight); 
            else if(CoreHelper.getOh(jg[jg.length-1]) === sOh) sc += (1.5 * weight); 
        });
        return sc;
    },
    getGod: (me, target) => {
        if(me === target) return '비겁';
        if({'木':'火', '火':'土', '土':'金', '金':'水', '水':'木'}[me] === target) return '식상';
        if({'木':'土', '火':'金', '土':'水', '金':'木', '水':'火'}[me] === target) return '재성';
        if({'木':'金', '火':'水', '土':'木', '金':'火', '水':'土'}[me] === target) return '관성';
        if({'木':'水', '火':'木', '土':'火', '金':'土', '水':'金'}[me] === target) return '인성';
        return '-';
    }
};

export const Pipeline = {
    run: (y, m, d, hStr, cal, isMale) => {
        let hr = 12, min = 0;
        if(hStr === 'yaja') { hr = 23; min = 30; } else if(hStr === 'joja') { hr = 0; min = 30; } else if(hStr !== 'none') { hr = parseInt(hStr); min = 0; }

        let sol, lun;
        if(cal === 'solar'){ sol = Solar.fromYmdHms(y,m,d,hr,min,0); lun = sol.getLunar(); } 
        else { lun = Lunar.fromYmdHms(y,m,d,hr,min,0); sol = lun.getSolar(); }
        
        const bazi = lun.getEightChar();
        let ch = [bazi.getYearGan(), bazi.getYearZhi(), bazi.getMonthGan(), bazi.getMonthZhi(), bazi.getDayGan(), bazi.getDayZhi()];
        let stems = [ch[0], ch[2], ch[4]];
        let branches = [ch[1], ch[3], ch[5]];
        
        if (hStr !== 'none') {
            ch.push(bazi.getTimeGan(), bazi.getTimeZhi());
            stems.push(ch[6]);
            branches.push(ch[7]);
        }

        const dG = ch[4] || '甲', dZ = ch[5], mZ = ch[3], oh = CoreHelper.getOh(dG) || '木';
        let logs = [], scores = {'木':0, '火':0, '土':0, '金':0, '水':0};

        logs.push({ level: 'sys', msg: `[Phase 1] 월령(${mZ}) 기준 가중치 파이프라인 개시.` });

        let branchStates = branches.map((char, i)=>({ char, weight: MYSTIC_CONFIG.baseWeights[i*2+1], clashCount: 0 }));

        // Phase 2. 지지충 스캔
        const bLen = branchStates.length;
        for(let i=0; i<bLen; i++) {
            for(let j=i+1; j<bLen; j++) {
                const b1 = branchStates[i], b2 = branchStates[j];
                RULES.CLASH.forEach(cp => {
                    if((b1.char===cp[0] && b2.char===cp[1]) || (b1.char===cp[1] && b2.char===cp[0])) {
                        b1.clashCount++; b2.clashCount++;
                        b1.weight *= Math.pow(MYSTIC_CONFIG.clashPenalty, b1.clashCount); 
                        b2.weight *= Math.pow(MYSTIC_CONFIG.clashPenalty, b2.clashCount); 
                        logs.push({ level: 'err', msg: `[Event] ${b1.char}${b2.char} 상충 발생. 에너지 누적 감쇠.` });
                    }
                });
            }
        }

        // Phase 3. 삼합
        let habScores = {'木':0, '火':0, '土':0, '金':0, '水':0};
        const activeB = branchStates.filter(b=>b.clashCount === 0).map(b=>b.char); 
        Object.entries(RULES.SAMHAP).forEach(([k, v]) => {
            if(v.every(b => activeB.includes(b))) {
                let bonus = RULES.SEASON_APPROVAL[k].includes(mZ) ? 4.0 : 1.5;
                habScores[CoreHelper.getOh(v[1])] += bonus;
                logs.push({ level: 'success', msg: `[Event] ${v.join('')} 합 형성 (+${bonus}).` });
            }
        });

        // Phase 4. 점수 정산
        let isTougan = false;
        ch.forEach((char, i) => {
            const el = CoreHelper.getOh(char); if(!el) return;
            let w = MYSTIC_CONFIG.baseWeights[i];
            if(i%2!==0 && branchStates[Math.floor(i/2)]) w = branchStates[Math.floor(i/2)].weight;
            else if(i%2===0) {
                let touganAmp = 1.0;
                branchStates.forEach(b => {
                    if(b.clashCount > 1) return;
                    const jg = RULES.JG[b.char];
                    if(jg) {
                        if(jg[jg.length-1] === char) touganAmp = Math.max(touganAmp, MYSTIC_CONFIG.touganMul.primary);
                        else if(jg.includes(char)) touganAmp = Math.max(touganAmp, MYSTIC_CONFIG.touganMul.middle);
                    }
                });
                if(touganAmp > 1.0) { w *= touganAmp; if(i===4) isTougan = true; }
            }
            scores[el] += w * CoreHelper.getSeasonMultiplier(el, mZ);
        });
        Object.keys(habScores).forEach(k => scores[k] += habScores[k]);

        // Phase 5. 판단 (종격 & 조후)
        let rootScore = CoreHelper.getTongGeunStrength(dG, branches);
        const motherEl = {'木':'水', '火':'木', '土':'火', '金':'土', '水':'金'}[oh];
        const totalEnergy = Object.values(scores).reduce((a,b)=>a+b, 0);
        const mySc = scores[oh] + scores[motherEl];
        const opMaxOh = Object.keys(scores).filter(k=>k!==oh && k!==motherEl).sort((a,b)=>scores[b]-scores[a])[0];

        let yong = '', hee = '', gi = '', trueGyuk = '';
        if((mySc/totalEnergy < MYSTIC_CONFIG.jongThreshold) && rootScore <= 2) {
            yong = opMaxOh; hee = oh; trueGyuk = '종격';
            logs.push({ level: 'err', msg: `[Critical] 절대 종격 판정.` });
        } else {
            const isWinter = ['亥','子','丑'].includes(mZ), isSummer = ['巳','午','未'].includes(mZ);
            if (isWinter && scores['水'] > scores['火']*1.5) { yong='火'; logs.push({ level: 'info', msg: `[조후] 냉골 사주. 화(火) 우선.` }); }
            else if (isSummer && scores['火'] > scores['水']*1.5) { yong='水'; logs.push({ level: 'info', msg: `[조후] 조열 사주. 수(水) 우선.` }); }
            else yong = mySc > (totalEnergy-mySc) ? opMaxOh : motherEl;

            let jg = RULES.JG[mZ] || []; let tg = null;
            for(let i=jg.length-1; i>=0; i--) { if(stems.includes(jg[i])) { tg = jg[i]; break; } }
            if(!tg) tg = jg[jg.length-1];
            trueGyuk = CoreHelper.getGod(oh, CoreHelper.getOh(tg)) + '격';
        }

        const cYear = new Date().getFullYear();
        let daewun = []; try{ const dyList=bazi.getYun(isMale?1:0).getDaYun(); for(let i=0;i<8;i++)if(dyList[i])daewun.push({age:dyList[i].getStartAge(), ganzhi:dyList[i].getGanZhi()}); }catch(e){}

        return { 
            ch, oh, dG, dZ, branchStates, isTougan, rootScore, trueGyuk, yong, scores, logs, hStr,
            daewun, curDw: daewun.find(dw => (cYear-sol.getYear()+1) >= dw.age) || daewun[0], cYear,
            solStr: `${sol.getYear()}년 ${sol.getMonth()}월 ${sol.getDay()}일`
        };
    }
};