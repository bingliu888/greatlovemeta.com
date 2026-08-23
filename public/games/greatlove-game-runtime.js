(function () {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') === 'play' ? 'play' : 'trial';
    const supported = ['zh', 'en', 'es', 'ja', 'ko', 'fr', 'de', 'ru', 'it', 'pt', 'ar', 'hi'];
    const requestedLang = params.get('lang') || 'en';
    const lang = supported.includes(requestedLang) ? requestedLang : 'en';

    function localDate() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    function gameRoute(game, nextMode, start) {
        const suffix = start ? '&start=1' : '';
        const path = game === 'monopoly' ? `/${lang}/lucky-wheel` : `/${lang}/games/${game}`;
        return `${path}?mode=${nextMode}${suffix}`;
    }

    function trialRoute(game) {
        return game === 'monopoly' ? `/${lang}/lucky-wheel?mode=trial` : `/${lang}/games/${game}?mode=trial`;
    }

    function navigate(path) {
        const target = window.top && window.top !== window ? window.top : window;
        target.location.assign(path);
    }

    function goToLogin(game) {
        const returnTo = `/api/game-launch?game=${encodeURIComponent(game)}&lang=${encodeURIComponent(lang)}`;
        navigate(`/${lang}/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }

    function gameLogRoute() {
        return `/${lang}/dashboard#game-log`;
    }

    function goToGameLog() {
        window.setTimeout(() => navigate(gameLogRoute()), 1200);
    }

    function statusElement() {
        let element = document.getElementById('greatlove-game-status');
        if (element) return element;
        element = document.createElement('div');
        element.id = 'greatlove-game-status';
        element.setAttribute('role', 'status');
        element.style.cssText = [
            'position:fixed',
            'left:50%',
            'bottom:20px',
            'z-index:1200',
            'width:min(620px,calc(100% - 28px))',
            'translate:-50% 0',
            'padding:14px 18px',
            'border:1px solid rgba(255,255,255,.24)',
            'border-radius:14px',
            'background:rgba(7,18,28,.94)',
            'box-shadow:0 18px 55px rgba(0,0,0,.38)',
            'color:#fff',
            'font:700 14px/1.5 system-ui,sans-serif',
            'text-align:center',
            'backdrop-filter:blur(14px)',
            'display:none'
        ].join(';');
        document.body.appendChild(element);
        return element;
    }

    function showStatus(message, tone) {
        const element = statusElement();
        element.textContent = message;
        element.style.display = 'block';
        element.style.borderColor = tone === 'error'
            ? 'rgba(255,111,111,.65)'
            : tone === 'saved'
                ? 'rgba(72,232,189,.65)'
                : 'rgba(255,215,0,.55)';
    }

    function showTrialResult(message) {
        const element = document.getElementById('greatlove-trial-result');
        if (!element) {
            showStatus(message, 'trial');
            return;
        }
        element.textContent = message;
        element.classList.remove('hidden');
    }

    function guardElement() {
        let element = document.getElementById('greatlove-game-guard');
        if (element) return element;
        element = document.createElement('div');
        element.id = 'greatlove-game-guard';
        element.style.cssText = [
            'position:fixed',
            'inset:0',
            'z-index:1500',
            'display:grid',
            'place-items:center',
            'padding:24px',
            'background:radial-gradient(circle at 50% 20%,#163d45 0,#09131f 62%,#050a12 100%)',
            'color:#fff',
            'font-family:system-ui,sans-serif',
            'text-align:center'
        ].join(';');
        document.body.appendChild(element);
        return element;
    }

    function showGuard(game, state) {
        const element = guardElement();
        const isLimit = state === 'limit';
        const isError = state === 'error';
        const title = isLimit
            ? (lang === 'zh' ? '今天的 Play 已完成' : "Today's Play is complete")
            : isError
                ? (lang === 'zh' ? '暂时无法开始 Play' : 'Play is temporarily unavailable')
                : (lang === 'zh' ? '正在确认今日次数' : "Checking today's Play");
        const message = isLimit
            ? (lang === 'zh' ? '这款游戏今天的一局正式成绩已经保存，请明天再来。' : 'Your official result for this game is already saved. Play again tomorrow.')
            : isError
                ? (lang === 'zh' ? '无法确认今天的游戏次数，请刷新页面后重试。' : "We couldn't verify today's play count. Refresh and try again.")
                : (lang === 'zh' ? '请稍候，游戏马上开始。' : 'One moment—the game will start shortly.');
        element.innerHTML = `<div style="max-width:620px"><div style="width:82px;height:82px;margin:0 auto 26px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.28);border-radius:50%;color:#f4c666;font-weight:900">${isLimit ? '01 / 01' : isError ? '!' : '•••'}</div><h1 style="margin:0 0 14px;font:700 clamp(34px,7vw,62px)/1.05 Georgia,serif">${title}</h1><p style="margin:0;color:rgba(255,255,255,.72);font-size:16px;line-height:1.7">${message}</p>${isLimit ? `<a href="${trialRoute(game)}" target="_top" style="margin-top:28px;min-height:46px;padding:0 22px;display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.36);border-radius:999px;color:#fff;text-decoration:none;font-weight:850">${lang === 'zh' ? '继续试玩' : 'Continue Test trial'}</a>` : ''}</div>`;
    }

    function disableRetry() {
        const retry = document.getElementById('retryBtn') || document.getElementById('retry-btn');
        if (!retry) return;
        retry.disabled = true;
        retry.textContent = lang === 'zh' ? '今天已完成 · 明天再来' : 'Completed today · Play tomorrow';
        retry.style.opacity = '0.62';
        retry.style.cursor = 'not-allowed';
    }

    async function guard(game) {
        if (mode !== 'play') return true;
        showGuard(game, 'loading');
        try {
            const response = await fetch(`/api/game-results?date=${localDate()}&game=${game}`, { cache: 'no-store' });
            if (response.status === 401) {
                goToLogin(game);
                return false;
            }
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error('Unable to verify play limit');
            if (result.limitReached || Number(result.playsRemaining) === 0) {
                showGuard(game, 'limit');
                return false;
            }
            document.getElementById('greatlove-game-guard')?.remove();
            return true;
        } catch {
            showGuard(game, 'error');
            return false;
        }
    }

    async function reportResult(game, rawScore, attemptId) {
        const reward = Number(rawScore) * 10000;
        if (mode !== 'play') {
            showTrialResult(
                lang === 'zh'
                    ? `试玩完成：${reward.toLocaleString()} GLC。正式 Play 登录后会保存成绩。`
                    : `Trial complete: ${reward.toLocaleString()} GLC. Sign in through Play to save it.`
            );
            return true;
        }
        showStatus(lang === 'zh' ? '正在保存本局成绩…' : 'Saving this result…', 'saving');
        try {
            const response = await fetch('/api/game-results', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ game, rawScore, attemptId, playDate: localDate() })
            });
            if (response.status === 401) {
                goToLogin(game);
                return true;
            }
            const result = await response.json().catch(() => ({}));
            if (response.status === 429 && result.code === 'DAILY_PLAY_LIMIT') {
                showStatus(
                    lang === 'zh' ? '今天这款游戏的一局 Play 已完成，请明天再来。' : "Today's Play is complete. Play again tomorrow.",
                    'saved'
                );
                disableRetry();
                goToGameLog();
                return true;
            }
            if (!response.ok) throw new Error(result.error || 'Unable to save');
            showStatus(
                lang === 'zh'
                    ? `成绩已保存：${reward.toLocaleString()} GLC。今天已完成，请明天再来。`
                    : `Result saved: ${reward.toLocaleString()} GLC. Play again tomorrow.`,
                'saved'
            );
            disableRetry();
            goToGameLog();
            return true;
        } catch {
            showStatus(
                lang === 'zh' ? '成绩暂时无法保存，请稍后重试本局。' : 'The result could not be saved. Please try again shortly.',
                'error'
            );
            return false;
        }
    }

    window.GreatLoveGameRuntime = {
        guard,
        reportResult,
        mode,
        lang,
        gameRoute,
        trialRoute
    };
})();
