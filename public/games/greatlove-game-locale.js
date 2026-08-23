(function () {
    const lang = new URLSearchParams(window.location.search).get('lang') || 'en';
    if (lang === 'en' || lang === 'zh') return;

    const source = {
        corp: ['INTERSTELLAR MINING CORP.', 'Interstellar Mining Corp.'],
        brief1: ['Year 3047, Deep-Space Mining Sector Seven...', '公元 3047 年，深空第七矿区...'],
        brief2: ["Guide the mining ship's claw system to capture drifting minerals.", '你操控采矿飞船的钩爪系统，精准捕获漂浮矿物。'],
        brief3: ['Mission: take 3 shots. Hits earn rewards; a miss earns 0.', '任务：每局发射 3 次。命中获得奖励，未命中为 0。'],
        available: ['Available shots', '可用抓取次数'],
        autoStart: ['Game starts automatically in 6 seconds', '6 秒后自动进入游戏'],
        minerId: ['矿工编号'],
        total: ['TOTAL REWARDS 总奖励', 'Total Rewards 总奖励', 'Total rewards', '总奖励'],
        remaining: ['剩余抓取次数', 'Spins left', '剩余次数'],
        shoot: ['点击画面发射钩爪！瞄准矿物！'],
        log: ['采集记录'],
        missionDone: ['采集任务完成'],
        collected: ['本次采集总量', 'Round reward', '本次总奖励'],
        retryMiner: ['再来一局'],
        wheelTitle: ['GLC Lucky Wheel', 'GLC 幸运轮盘'],
        wheelBrand: ['by GreatLoveMeta', '大爱元宇宙'],
        wheelIntro1: ['Spin the Lucky Wheel and turn every landing into a GLC game score.', '转动幸运轮盘，每次落点都对应 GLC 游戏成绩。'],
        wheelIntro2: ['Each round includes 3 spins and records the completed result automatically—no wallet required.', '每局可转动 3 次，完成后自动记录，无需钱包。'],
        startSpin: ['START', '转动'],
        spin: ['SPIN', '开始'],
        retryWheel: ['Spin another round', '再转一局'],
        playNote: ['Play saves one official result per day. Test trials are unlimited and need no wallet.', '正式 Play 的成绩会自动保存，每天最多 1 局；试玩不限次数，无需输入钱包。'],
    };

    const copy = {
        es: ['CORPORACIÓN MINERA INTERESTELAR', 'Año 3047, Sector Minero Siete del espacio profundo...', 'Guía la garra de la nave minera para capturar minerales a la deriva.', 'Misión: realiza 3 intentos. Los aciertos dan recompensas; los fallos valen 0.', 'Intentos disponibles', 'El juego comienza automáticamente en 6 segundos', 'ID del minero', 'RECOMPENSAS TOTALES', 'Intentos restantes', '¡Toca la pantalla para lanzar la garra y apunta a un mineral!', 'Registro de extracción', 'Misión de extracción completada', 'Total extraído', 'Jugar otra ronda', 'Ruleta de la suerte GLC', 'por GreatLoveMeta', 'Gira la ruleta y convierte cada resultado en una puntuación GLC.', 'Cada ronda tiene 3 giros y guarda el resultado automáticamente, sin cartera.', 'INICIAR', 'GIRO', 'Girar otra ronda', 'Play guarda un resultado oficial al día. Las pruebas son ilimitadas y no requieren cartera.'],
        ja: ['星間採掘公社', '西暦3047年、深宇宙第7採掘区域…', '採掘船のクローを操作して、漂う鉱物を正確に回収します。', 'ミッション：3回発射します。命中で報酬、外れは0です。', '使用可能な回数', '6秒後に自動でゲームを開始します', 'マイナーID', '合計報酬', '残り回数', '画面をタップしてクローを発射し、鉱物を狙いましょう！', '採掘記録', '採掘ミッション完了', '今回の採掘量', 'もう一度プレイ', 'GLC ラッキーホイール', 'GreatLoveMeta 提供', 'ラッキーホイールを回し、結果をGLCゲームスコアに変えましょう。', '1ラウンドは3回。結果は自動保存され、ウォレットは不要です。', '開始', 'スピン', 'もう一度回す', 'Playは1日1回の公式結果を保存します。体験版は回数無制限でウォレット不要です。'],
        ko: ['성간 채굴 공사', '서기 3047년, 심우주 제7 채굴 구역…', '채굴선 집게를 조종해 떠다니는 광물을 정확히 포획하세요.', '임무: 3번 발사합니다. 명중하면 보상, 실패하면 0점입니다.', '사용 가능한 횟수', '6초 후 게임이 자동으로 시작됩니다', '광부 ID', '총 보상', '남은 횟수', '화면을 눌러 집게를 발사하고 광물을 조준하세요!', '채굴 기록', '채굴 임무 완료', '이번 채굴량', '한 판 더', 'GLC 행운의 룰렛', 'GreatLoveMeta 제공', '행운의 룰렛을 돌려 결과를 GLC 게임 점수로 만드세요.', '한 라운드는 3회이며 결과가 자동 저장되고 지갑은 필요 없습니다.', '시작', '돌리기', '한 번 더 돌리기', 'Play는 하루 한 번 공식 결과를 저장합니다. 체험판은 무제한이며 지갑이 필요 없습니다.'],
        fr: ['SOCIÉTÉ MINIÈRE INTERSTELLAIRE', 'An 3047, secteur minier sept de l’espace profond…', 'Dirigez la pince du vaisseau minier pour capturer les minerais en dérive.', 'Mission : 3 tirs. Une prise rapporte, un échec vaut 0.', 'Essais disponibles', 'Le jeu démarre automatiquement dans 6 secondes', 'ID du mineur', 'RÉCOMPENSES TOTALES', 'Essais restants', 'Touchez l’écran pour lancer la pince et viser un minerai !', 'Journal d’extraction', 'Mission d’extraction terminée', 'Total extrait', 'Rejouer', 'Roue de la chance GLC', 'par GreatLoveMeta', 'Faites tourner la roue et transformez chaque résultat en score GLC.', 'Chaque manche comprend 3 tours et enregistre automatiquement le résultat, sans portefeuille.', 'DÉMARRER', 'TOURNER', 'Tourner à nouveau', 'Play enregistre un résultat officiel par jour. Les essais sont illimités et sans portefeuille.'],
        de: ['INTERSTELLARE BERGBAUGESELLSCHAFT', 'Jahr 3047, Tiefraum-Bergbausektor Sieben…', 'Steuere die Greifklaue des Bergbauschiffs und fange treibende Mineralien ein.', 'Mission: 3 Versuche. Treffer bringen Belohnungen, Fehlschüsse 0.', 'Verfügbare Versuche', 'Das Spiel startet in 6 Sekunden automatisch', 'Bergmann-ID', 'GESAMTBELOHNUNG', 'Verbleibende Versuche', 'Tippe, um die Klaue abzufeuern und auf ein Mineral zu zielen!', 'Abbauprotokoll', 'Abbaumission abgeschlossen', 'Gesamter Abbau', 'Noch eine Runde', 'GLC Glücksrad', 'von GreatLoveMeta', 'Drehe das Glücksrad und verwandle jedes Ergebnis in einen GLC-Spielstand.', 'Jede Runde hat 3 Drehungen und speichert das Ergebnis automatisch – ohne Wallet.', 'START', 'DREHEN', 'Noch einmal drehen', 'Play speichert täglich ein offizielles Ergebnis. Tests sind unbegrenzt und brauchen kein Wallet.'],
        ru: ['МЕЖЗВЁЗДНАЯ ГОРНОДОБЫВАЮЩАЯ КОРПОРАЦИЯ', '3047 год, седьмой горнодобывающий сектор дальнего космоса…', 'Управляйте захватом корабля и собирайте дрейфующие минералы.', 'Задание: 3 выстрела. Попадание даёт награду, промах — 0.', 'Доступные попытки', 'Игра начнётся автоматически через 6 секунд', 'ID шахтёра', 'ОБЩАЯ НАГРАДА', 'Осталось попыток', 'Нажмите на экран, чтобы запустить захват и прицелиться!', 'Журнал добычи', 'Задание выполнено', 'Всего добыто', 'Ещё один раунд', 'Колесо удачи GLC', 'от GreatLoveMeta', 'Крутите колесо и превращайте каждый результат в игровой счёт GLC.', 'В каждом раунде 3 вращения, результат сохраняется автоматически, кошелёк не нужен.', 'СТАРТ', 'КРУТИТЬ', 'Крутить снова', 'Play сохраняет один официальный результат в день. Пробные игры не ограничены и не требуют кошелька.'],
        it: ['SOCIETÀ MINERARIA INTERSTELLARE', 'Anno 3047, settore minerario sette dello spazio profondo…', 'Guida l’artiglio della nave mineraria per catturare i minerali alla deriva.', 'Missione: 3 lanci. I centri danno ricompense, gli errori valgono 0.', 'Tentativi disponibili', 'Il gioco inizierà automaticamente tra 6 secondi', 'ID minatore', 'RICOMPENSE TOTALI', 'Tentativi rimasti', 'Tocca lo schermo per lanciare l’artiglio e mirare a un minerale!', 'Registro estrazione', 'Missione di estrazione completata', 'Totale estratto', 'Gioca ancora', 'Ruota della fortuna GLC', 'di GreatLoveMeta', 'Gira la ruota e trasforma ogni risultato in un punteggio GLC.', 'Ogni turno include 3 giri e salva automaticamente il risultato, senza portafoglio.', 'AVVIA', 'GIRA', 'Gira ancora', 'Play salva un risultato ufficiale al giorno. Le prove sono illimitate e non richiedono un portafoglio.'],
        pt: ['CORPORAÇÃO DE MINERAÇÃO INTERESTELAR', 'Ano 3047, Setor de Mineração Sete do espaço profundo…', 'Controle a garra da nave mineradora para capturar minerais à deriva.', 'Missão: 3 lançamentos. Acertos dão recompensas; erros valem 0.', 'Tentativas disponíveis', 'O jogo começa automaticamente em 6 segundos', 'ID do minerador', 'RECOMPENSAS TOTAIS', 'Tentativas restantes', 'Toque na tela para lançar a garra e mirar em um mineral!', 'Registro de mineração', 'Missão de mineração concluída', 'Total extraído', 'Jogar outra rodada', 'Roda da Sorte GLC', 'por GreatLoveMeta', 'Gire a roda e transforme cada resultado em uma pontuação GLC.', 'Cada rodada tem 3 giros e salva o resultado automaticamente, sem carteira.', 'INICIAR', 'GIRAR', 'Girar novamente', 'Play salva um resultado oficial por dia. Os testes são ilimitados e não exigem carteira.'],
        ar: ['شركة التعدين بين النجوم', 'عام 3047، قطاع التعدين السابع في الفضاء السحيق…', 'وجّه مخلب سفينة التعدين لالتقاط المعادن الطافية.', 'المهمة: 3 محاولات. الإصابة تمنح مكافأة والإخفاق يساوي 0.', 'المحاولات المتاحة', 'ستبدأ اللعبة تلقائيًا خلال 6 ثوانٍ', 'معرّف المُعدّن', 'إجمالي المكافآت', 'المحاولات المتبقية', 'المس الشاشة لإطلاق المخلب والتصويب نحو معدن!', 'سجل التعدين', 'اكتملت مهمة التعدين', 'إجمالي الاستخراج', 'جولة أخرى', 'عجلة الحظ GLC', 'من GreatLoveMeta', 'أدر عجلة الحظ وحوّل كل نتيجة إلى نقاط GLC.', 'تتضمن كل جولة 3 دورات وتُحفظ النتيجة تلقائيًا من دون محفظة.', 'ابدأ', 'أدر', 'أدر مرة أخرى', 'يحفظ Play نتيجة رسمية واحدة يوميًا. التجارب غير محدودة ولا تحتاج إلى محفظة.'],
        hi: ['अंतरतारकीय खनन निगम', 'वर्ष 3047, गहरे अंतरिक्ष का खनन क्षेत्र सात…', 'बहते खनिजों को पकड़ने के लिए खनन यान के पंजे को नियंत्रित करें।', 'मिशन: 3 प्रयास। सही पकड़ पर पुरस्कार, चूक पर 0।', 'उपलब्ध प्रयास', 'खेल 6 सेकंड में अपने आप शुरू होगा', 'खनिक आईडी', 'कुल पुरस्कार', 'शेष प्रयास', 'पंजा चलाने और खनिज पर निशाना लगाने के लिए स्क्रीन टैप करें!', 'खनन रिकॉर्ड', 'खनन मिशन पूरा हुआ', 'कुल खनन', 'एक और दौर', 'GLC भाग्य चक्र', 'GreatLoveMeta द्वारा', 'भाग्य चक्र घुमाएँ और हर परिणाम को GLC गेम स्कोर में बदलें।', 'हर दौर में 3 घुमाव हैं और परिणाम अपने आप सहेजा जाता है—वॉलेट की जरूरत नहीं।', 'शुरू', 'घुमाएँ', 'फिर घुमाएँ', 'Play रोज एक आधिकारिक परिणाम सहेजता है। परीक्षण असीमित हैं और वॉलेट की जरूरत नहीं।'],
    };

    const keys = Object.keys(source);
    const values = copy[lang];
    if (!values) return;
    const translations = new Map();
    keys.forEach((key, index) => source[key].forEach((text) => translations.set(text, values[index])));
    const footerCopy = {
        es: ['© 2026 RUEDA DE LA SUERTE GLC •', '• Fortuna en cada giro'],
        ja: ['© 2026 GLC ラッキーホイール •', '• 回すたびに幸運を'],
        ko: ['© 2026 GLC 행운의 룰렛 •', '• 돌릴 때마다 행운을'],
        fr: ['© 2026 ROUE DE LA CHANCE GLC •', '• La chance à chaque tour'],
        de: ['© 2026 GLC GLÜCKSRAD •', '• Glück bei jeder Drehung'],
        ru: ['© 2026 КОЛЕСО УДАЧИ GLC •', '• Удача в каждом вращении'],
        it: ['© 2026 RUOTA DELLA FORTUNA GLC •', '• Fortuna a ogni giro'],
        pt: ['© 2026 RODA DA SORTE GLC •', '• Sorte em cada giro'],
        ar: ['© 2026 عجلة الحظ GLC •', '• الحظ مع كل دورة'],
        hi: ['© 2026 GLC भाग्य चक्र •', '• हर घुमाव में सौभाग्य'],
    }[lang];
    if (footerCopy) {
        translations.set('© 2026 GLC Lucky Wheel •', footerCopy[0]);
        translations.set('• Fortune in every spin', footerCopy[1]);
    }

    function translateText(node) {
        const original = node.nodeValue || '';
        const trimmed = original.trim();
        const translated = translations.get(trimmed);
        if (!translated) return;
        const leading = original.match(/^\s*/)?.[0] || '';
        const trailing = original.match(/\s*$/)?.[0] || '';
        node.nodeValue = `${leading}${translated}${trailing}`;
    }

    function translate(root) {
        if (root.nodeType === Node.TEXT_NODE) {
            translateText(root);
            return;
        }
        if (!(root instanceof Element) && root !== document) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (node.parentElement?.closest('script,style')) continue;
            translateText(node);
        }
    }

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    translate(document);
    new MutationObserver((records) => records.forEach((record) => {
        if (record.type === 'characterData') translateText(record.target);
        record.addedNodes.forEach(translate);
    })).observe(document.body, { subtree: true, childList: true, characterData: true });
})();
