/**
 * destinote 명리학 엔진 2.0 (Expert Edition)
 * - 월령(月令) 기반 오행 세력 가중치 산출
 * - 천간의 지지 통근(通根) 및 뿌리 강도 검사
 * - 조후(調候) / 억부(抑扶) 통합 용신 알고리즘
 * - 공망(空亡) 및 12운성 에너지 측정
 */

const Engine2 = {
    // 오행 상생상극 기본 규칙
    rules: {
        mother: {'木':'水', '火':'木', '土':'火', '金':'土', '水':'金'},
        child: {'木':'火', '火':'土', '土':'金', '金':'水', '水':'木'},
        wealth: {'木':'土', '火':'金', '土':'水', '金':'木', '水':'火'},
        power: {'木':'金', '火':'水', '土':'木', '金':'火', '水':'土'}
    },

    getOhaeng: (c) => {
        if('甲乙寅卯'.includes(c)) return '木';
        if('丙丁巳午'.includes(c)) return '火';
        if('戊己辰戌丑未'.includes(c)) return '土';
        if('庚辛申酉'.includes(c)) return '金';
        if('壬癸亥子'.includes(c)) return '水';
        return '';
    },

    // --- 2.0 핵심: 정밀 오행 강약 계산 (월령/가중치 반영) ---
    calculateStrength: (ch) => {
        let scores = {'木':0, '火':0, '土':0, '金':0, '水':0};
        const weights = [1, 3, 1, 3, 1, 2, 1, 2]; // [연간, 연지, 월간, 월지, 일간, 일지, 시간, 시지] 가중치
        
        ch.forEach((char, i) => {
            const oh = Engine2.getOhaeng(char);
            if(oh) scores[oh] += weights[i];
        });
        return scores;
    },

    // --- 2.0 핵심: 통근(Rooting) 검사 ---
    checkTongGeun: (stem, branches) => {
        const oh = Engine2.getOhaeng(stem);
        return branches.some(z => Engine2.getOhaeng(z) === oh);
    },

    // --- 2.0 핵심: 공망(Empty Void) 산출 ---
    getGongmang: (dG, dZ) => {
        const stems = '甲乙丙丁戊己庚辛壬癸';
        const branches = '子丑寅卯辰巳午未申酉戌亥';
        const sIdx = stems.indexOf(dG);
        const zIdx = branches.indexOf(dZ);
        if(sIdx === -1 || zIdx === -1) return [];
        const targetIdx1 = (zIdx - sIdx + 12) % 12;
        const targetIdx2 = (zIdx - sIdx + 11) % 12;
        return [branches.charAt(targetIdx2), branches.charAt(targetIdx1)];
    },

    // 12운성 측정
    getWounsung: (stem, branch) => {
        const map = {
            '甲':['亥','子','丑','寅','卯','辰','巳','午','未','申','酉','戌'], '丙':['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'],
            '戊':['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'], '庚':['巳','午','未','申','酉','戌','亥','子','丑','寅','卯','辰'],
            '壬':['申','酉','戌','亥','子','丑','寅','卯','辰','巳','午','未'], '乙':['午','巳','辰','卯','寅','丑','子','亥','戌','酉','申','未'],
            '丁':['酉','申','未','午','巳','辰','卯','寅','丑','子','亥','戌'], '己':['酉','申','未','午','巳','辰','卯','寅','丑','子','亥','戌'],
            '辛':['子','亥','戌','酉','申','미','午','巳','辰','卯','寅','丑'], '癸':['卯','寅','丑','子','亥','戌','酉','申','未','午','巳','辰']
        };
        const names = ['장생','목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양'];
        const idx = map[stem]?.indexOf(branch);
        return idx !== -1 ? names[idx] : '';
    },

    // 통합 사주 풀이 엔진
    run: (y, m, d, hStr, cal, isMale) => {
        // 1. 시간 보정 및 명식 추출
        let hr = 12, min = 0;
        if(hStr === 'yaja') { hr = 23; min = 45; }
        else if(hStr === 'joja') { hr = 0; min = 30; }
        else if(hStr !== 'none') { hr = parseInt(hStr); min = 0; }

        let sol, lun;
        if(cal === 'solar'){ sol = Solar.fromYmdHms(y,m,d,hr,min,0); lun = sol.getLunar(); }
        else { lun = Lunar.fromYmdHms(y,m,d,hr,min,0); sol = lun.getSolar(); }
        
        const bazi = lun.getEightChar();
        const ch = [bazi.getYearGan(), bazi.getYearZhi(), bazi.getMonthGan(), bazi.getMonthZhi(), bazi.getDayGan(), bazi.getDayZhi(), hStr==='none'?'모름':bazi.getTimeGan(), hStr==='none'?'모름':bazi.getTimeZhi()];
        
        const oh = Engine2.getOhaeng(ch[4]);
        const e = Engine2.calculateStrength(ch);
        const br = [ch[1], ch[3], ch[5], ch[7]];

        // 2. 용신 도출 (조후/억부 통합)
        let yong = '';
        if(['亥','子','丑'].includes(ch[3]) && ['木','水','金'].includes(oh)) yong = '火';
        else if(['巳','午','未'].includes(ch[3]) && ['木','火','土'].includes(oh)) yong = '水';
        else {
            const mySc = e[oh] + e[Engine2.rules.mother[oh]];
            const opSc = e[Engine2.rules.child[oh]] + e[Engine2.rules.wealth[oh]] + e[Engine2.rules.power[oh]];
            if(mySc > opSc) yong = (e[Engine2.rules.wealth[oh]] >= e[Engine2.rules.power[oh]]) ? Engine2.rules.wealth[oh] : Engine2.rules.power[oh];
            else yong = (e[Engine2.rules.mother[oh]] >= e[oh]) ? Engine2.rules.mother[oh] : oh;
        }

        // 3. 십이운성/공망/신살
        const w12_p = Engine2.getWounsung(ch[4], ch[5]);
        const gm = Engine2.getGongmang(ch[4], ch[5]);
        let gmPos = [];
        if(gm.includes(ch[1])) gmPos.push('년지');
        if(gm.includes(ch[3])) gmPos.push('월지');
        if(gm.includes(ch[7])) gmPos.push('시지');

        // 4. 대운 추출
        let daewun = [];
        try { 
            const dyList = bazi.getYun(isMale?1:0).getDaYun(); 
            for(let i=0; i<8; i++) if(dyList[i]) daewun.push({age: dyList[i].getStartAge(), ganzhi: dyList[i].getGanZhi()});
        } catch(e) {}

        return { ch, oh, e, yong, w12_p, gm: {chars: gm.join(', '), pos: gmPos}, daewun, solStr: `${sol.getYear()}년 ${sol.getMonth()}월 ${sol.getDay()}일 ${hStr!=='none'?(hStr==='yaja'?'야자시':(hStr==='joja'?'조자시':hr+'시')):'시간모름'}`, bazi, age: new Date().getFullYear() - y + 1 };
    }
};