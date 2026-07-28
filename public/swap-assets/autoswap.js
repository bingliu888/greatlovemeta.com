(function () {
  'use strict';

  var app = document.querySelector('[data-autoswap-app]');
  if (!app) return;

  var config = window.GREATLOVE_AUTOSWAP_CONFIG || {};
  var ethersLib = window.ethers;
  var pageLang = document.documentElement.lang === 'en' || /^\/en(?:\/|$)/i.test(window.location.pathname) ? 'en' : 'zh';
  var I18N = {
    en: {
      loadingNetwork: 'Loading network',
      noMarket: 'No market configured. Add one in assets/config/autoswap.config.js.',
      ethersMissing: 'ethers library did not load. Check internet access or host ethers locally.',
      addressMissing: 'Add real contract addresses in assets/config/autoswap.config.js before loading market data.',
      rpcMissing: 'RPC URL is missing in assets/config/autoswap.config.js.',
      connecting: 'Connecting wallet...',
      connected: 'Connected: ',
      connectFirst: 'Connect wallet first',
      placeBuy: 'Place Buy Order',
      placeSell: 'Place Sell Order',
      buyTitle: 'Buy ',
      sellTitle: 'Sell ',
      toBuy: ' to buy',
      toSell: ' to sell',
      toPay: ' to pay',
      toReceive: ' to receive',
      enterPrice: 'Enter GLC and GLUSD amounts to calculate price.',
      noLimit: 'No limit',
      noMinimum: 'No minimum',
      noMaximum: 'No maximum',
      noStepLimit: 'No step limit',
      refreshing: 'Refreshing market...',
      marketLoaded: 'Market data loaded.',
      noOrders: 'No active orders found.',
      connectMyOrders: 'Connect wallet to view your active orders.',
      loadingMyOrders: 'Loading your active orders...',
      noMyOrders: 'No active orders for this wallet.',
      connectMyHistory: 'Connect wallet to view your recent transactions.',
      loadingMyHistory: 'Loading your recent transactions...',
      noMyHistory: 'No recent transactions for this wallet.',
      loadingHistory: 'Loading recent transactions...',
      noHistory: 'No recent transactions found in the configured scan range.',
      buyOpened: 'Buy order opened',
      sellOpened: 'Sell order opened',
      orderMatched: 'Order matched',
      orderCanceled: 'Order canceled',
      activity: 'AutoSwap activity',
      confirmedPolygon: 'Transaction confirmed on Polygon.',
      orderAdded: ' was added to the market.',
      traded: ' traded ',
      forText: ' for ',
      wasCanceled: ' was canceled.',
      chooseWallet: 'Connect wallet first.',
      validAmount: 'Enter a valid amount.',
      approvalSubmitted: 'Approval submitted: ',
      checkingApproval: 'Checking token approval...',
      checkingMatchApproval: 'Checking token approval for match...',
      refreshDone: 'Updated.',
      refreshingShort: 'Refreshing...',
      enterAmountsCheck: 'Enter amounts to check price range, minimum step, and wallet balance.',
      marketLimitsLoading: 'Loading market limits before validation.',
      priceWithinRange: 'Order price is within the current allowed range.',
      priceOutOfRange: 'Order price must be between {lower} and {upper}.',
      minQuoteCheck: 'Minimum {side} order is {amount}.',
      maxQuoteCheck: 'Maximum {side} order is {amount}.',
      baseStepCheck: 'GLC amount must be a multiple of {amount}.',
      notEnoughBase: 'Insufficient GLC balance.',
      notEnoughQuote: 'Insufficient GLUSD balance.',
      readyToSubmit: 'Order is ready to submit.',
      buySide: 'buy',
      sellSide: 'sell',
      transactionProgress: 'Transaction in progress',
      walletConfirm: 'Confirm in your wallet and wait for on-chain confirmation.',
      executingBuy: 'Submitting buy order. Please do not close this page.',
      executingSell: 'Submitting sell order. Please do not close this page.',
      executingMatch: 'Matching order. Please do not close this page.',
      executingCancel: 'Canceling order. Please do not close this page.',
      submittingBuy: 'Submitting buy order...',
      submittingSell: 'Submitting sell order...',
      buySubmitted: 'Buy order submitted: ',
      sellSubmitted: 'Sell order submitted: ',
      confirmedRefreshing: 'Transaction confirmed. Refreshing data.',
      orderInactive: 'Order is not active.',
      submittingMatch: 'Submitting match transaction...',
      matchSubmitted: 'Match submitted: ',
      matchConfirmed: 'Match confirmed.',
      submittingCancel: 'Submitting cancel transaction...',
      cancelSubmitted: 'Cancel submitted: ',
      cancelConfirmed: 'Order canceled.'
    },
    zh: {
      loadingNetwork: '加载网络',
      noMarket: '未配置市场，请在 assets/config/autoswap.config.js 中添加市场。',
      ethersMissing: 'ethers 库未加载，请检查网络或改为本地托管 ethers。',
      addressMissing: '请先在 assets/config/autoswap.config.js 中填写真实合约地址。',
      rpcMissing: 'assets/config/autoswap.config.js 中缺少 RPC URL。',
      connecting: '正在连接钱包...',
      connected: '已连接：',
      connectFirst: '请先连接钱包',
      placeBuy: '提交买入订单',
      placeSell: '提交卖出订单',
      buyTitle: '买入 ',
      sellTitle: '卖出 ',
      toBuy: ' 买入数量',
      toSell: ' 卖出数量',
      toPay: ' 支付数量',
      toReceive: ' 获得数量',
      enterPrice: '输入 GLC 和 GLUSD 数量后计算价格。',
      noLimit: '无限制',
      noMinimum: '无最低限制',
      noMaximum: '无最高限制',
      noStepLimit: '无最小单位限制',
      refreshing: '正在刷新市场...',
      marketLoaded: '市场数据已加载。',
      noOrders: '暂无当前挂单。',
      connectMyOrders: '连接钱包后查看你的当前挂单。',
      loadingMyOrders: '正在加载你的当前挂单...',
      noMyOrders: '该钱包暂无当前挂单。',
      connectMyHistory: '连接钱包后查看你的最近交易。',
      loadingMyHistory: '正在加载你的最近交易...',
      noMyHistory: '该钱包暂无最近交易。',
      loadingHistory: '正在加载最近交易...',
      noHistory: '配置的扫描范围内没有找到最近交易。',
      buyOpened: '买入订单已挂出',
      sellOpened: '卖出订单已挂出',
      orderMatched: '订单已成交',
      orderCanceled: '订单已取消',
      activity: '自动兑换活动',
      confirmedPolygon: '交易已在 Polygon 确认。',
      orderAdded: ' 已加入市场。',
      traded: ' 成交 ',
      forText: '，获得 ',
      wasCanceled: ' 已取消。',
      chooseWallet: '请先连接钱包。',
      validAmount: '请输入有效数量。',
      approvalSubmitted: '授权交易已提交：',
      checkingApproval: '正在检查代币授权...',
      checkingMatchApproval: '正在检查成交所需授权...',
      refreshDone: '已更新。',
      refreshingShort: '刷新中...',
      enterAmountsCheck: '输入数量后会自动检查价格范围、最小单位和钱包余额。',
      marketLimitsLoading: '正在加载市场限制，加载完成后可检查订单。',
      priceWithinRange: '订单价格在当前允许范围内。',
      priceOutOfRange: '订单价格必须在 {lower} 到 {upper} 之间。',
      minQuoteCheck: '{side}订单最低金额为 {amount}。',
      maxQuoteCheck: '{side}订单最高金额为 {amount}。',
      baseStepCheck: 'GLC 数量必须是 {amount} 的整数倍。',
      notEnoughBase: 'GLC 余额不足。',
      notEnoughQuote: 'GLUSD 余额不足。',
      readyToSubmit: '订单可以提交。',
      buySide: '买入',
      sellSide: '卖出',
      transactionProgress: '交易执行中',
      walletConfirm: '请在钱包中确认，并等待链上确认。',
      executingBuy: '正在提交买入订单，请不要关闭页面。',
      executingSell: '正在提交卖出订单，请不要关闭页面。',
      executingMatch: '正在成交订单，请不要关闭页面。',
      executingCancel: '正在取消订单，请不要关闭页面。',
      submittingBuy: '正在提交买入订单...',
      submittingSell: '正在提交卖出订单...',
      buySubmitted: '买入订单已提交：',
      sellSubmitted: '卖出订单已提交：',
      confirmedRefreshing: '交易已确认，正在刷新数据。',
      orderInactive: '该订单不是当前有效订单。',
      submittingMatch: '正在提交成交交易...',
      matchSubmitted: '成交交易已提交：',
      matchConfirmed: '成交已确认。',
      submittingCancel: '正在提交取消订单交易...',
      cancelSubmitted: '取消订单交易已提交：',
      cancelConfirmed: '订单已取消。'
    }
  };
  function t(key) {
    return (I18N[pageLang] && I18N[pageLang][key]) || I18N.en[key] || key;
  }
  var state = {
    method: null,
    provider: null,
    readProvider: null,
    browserProvider: null,
    signer: null,
    wallet: '',
    side: 'buy',
    market: null,
    orderBook: null,
    baseToken: null,
    quoteToken: null,
    writeOrderBook: null,
    writeBaseToken: null,
    writeQuoteToken: null,
    orderBookAbi: null,
    baseDecimals: 18,
    quoteDecimals: 18,
    historyHtml: '',
    marketLimits: null,
    baseBalance: null,
    quoteBalance: null,
    isExecuting: false
  };

  var ERC20_ABI = [
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 value) returns (bool)'
  ];

  var selectors = {
    status: '[data-status]',
    pairLabel: '[data-pair-label]',
    orderBookLabel: '[data-orderbook-label]',
    networkLabel: '[data-network-label]',
    walletAddress: '[data-wallet-address]',
    walletBaseBalance: '[data-wallet-base-balance]',
    walletQuoteBalance: '[data-wallet-quote-balance]',
    orderTitle: '[data-order-title]',
    baseFieldLabel: '[data-base-field-label]',
    quoteFieldLabel: '[data-quote-field-label]',
    bestBid: '[data-best-bid]',
    bestAsk: '[data-best-ask]',
    lastPrice: '[data-last-price]',
    priceRange: '[data-price-range]',
    minBuy: '[data-min-buy]',
    minSell: '[data-min-sell]',
    maxBuy: '[data-max-buy]',
    maxSell: '[data-max-sell]',
    minBaseUnit: '[data-min-base-unit]',
    enteredPrice: '[data-entered-price]',
    orderChecks: '[data-order-checks]',
    baseSymbol: '[data-base-symbol]',
    quoteSymbol: '[data-quote-symbol]',
    ordersBody: '[data-orders-body]',
    myOrdersBody: '[data-my-orders-body]',
    myHistoryBody: '[data-my-history-body]',
    historyBody: '[data-history-body]',
    submitOrder: '[data-submit-order]',
    executionOverlay: '[data-execution-overlay]',
    executionTitle: '[data-execution-title]',
    executionMessage: '[data-execution-message]'
  };

  function $(selector) {
    return app.querySelector(selector);
  }

  function setStatus(message, type) {
    var node = $(selectors.status);
    if (!node) return;
    node.textContent = message;
    node.classList.remove('error', 'success');
    if (type) node.classList.add(type);
  }

  function shorten(value) {
    if (!value || value.length < 14) return value || '';
    return value.slice(0, 6) + '...' + value.slice(-4);
  }

  function setTextAll(selector, value) {
    app.querySelectorAll(selector).forEach(function (node) {
      node.textContent = value;
    });
  }

  function isPlaceholderAddress(value) {
    return !value || /^0x0{40}$/i.test(value);
  }

  function getMarket() {
    var markets = Array.isArray(config.markets) ? config.markets : [];
    return markets.find(function (market) {
      return market.id === config.defaultMarketId;
    }) || markets[0] || null;
  }

  function requireEthers() {
    if (!ethersLib) {
      throw new Error('ethers library is not loaded.');
    }
  }

  async function loadAbi() {
    if (state.orderBookAbi) return state.orderBookAbi;
    var response = await fetch('assets/abi/AutoSwapLimitOrderBook.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load AutoSwapLimitOrderBook ABI.');
    state.orderBookAbi = await response.json();
    return state.orderBookAbi;
  }

  function formatUnits(value, decimals, precision) {
    var formatted = ethersLib.formatUnits(value || 0n, decimals);
    var parts = formatted.split('.');
    if (!parts[1] || precision == null) return formatted;
    var trimmed = parts[1].slice(0, precision).replace(/0+$/, '');
    return trimmed ? parts[0] + '.' + trimmed : parts[0];
  }

  function formatUnitsRounded(value, decimals, precision) {
    var amount = value || 0n;
    if (precision == null || decimals <= precision) {
      return formatUnits(amount, decimals, precision);
    }
    var scale = 10n ** BigInt(decimals - precision);
    var rounded = (amount + scale / 2n) / scale;
    return formatUnits(rounded, precision, precision);
  }

  function parseAmount(value, decimals) {
    var normalized = String(value || '').trim();
    if (!normalized || Number(normalized) <= 0) throw new Error(t('validAmount'));
    return ethersLib.parseUnits(normalized, decimals);
  }

  function tryParseAmount(value, decimals) {
    try {
      return parseAmount(value, decimals);
    } catch (err) {
      return null;
    }
  }

  function templateText(value, replacements) {
    return Object.keys(replacements || {}).reduce(function (result, key) {
      return result.replace('{' + key + '}', replacements[key]);
    }, value);
  }

  function quoteForBase(baseAmount, priceX18, baseDecimals, quoteDecimals) {
    var quoteX18 = baseAmount * priceX18 / (10n ** BigInt(baseDecimals));
    var result = quoteX18 * (10n ** BigInt(quoteDecimals)) / 1000000000000000000n;
    if (result === 0n && baseAmount > 0n) return 1n;
    return result;
  }

  function roundedPercentPrice(priceX18, percent) {
    return (priceX18 * percent + 50n) / 100n;
  }

  function priceText(priceX18) {
    if (!priceX18 || priceX18 === 0n) return '-';
    return formatUnitsRounded(priceX18, 18, 9) + ' ' + state.market.symbols.quote + ' / ' + state.market.symbols.base;
  }

  function enteredPriceText() {
    var form = app.querySelector('[data-order-form]');
    if (!form || !state.market) return '';
    var baseAmount = Number(String(form.elements.baseAmount.value || '').trim());
    var quoteAmount = Number(String(form.elements.quoteAmount.value || '').trim());
    if (!baseAmount || !quoteAmount || baseAmount <= 0 || quoteAmount <= 0) {
      return t('enterPrice');
    }
    var price = quoteAmount / baseAmount;
    return '1 ' + state.market.symbols.base + ' = ' +
      price.toLocaleString(undefined, { maximumFractionDigits: 9 }) +
      ' ' + state.market.symbols.quote;
  }

  function updateEnteredPrice() {
    if ($(selectors.enteredPrice)) {
      $(selectors.enteredPrice).textContent = enteredPriceText();
    }
    renderOrderValidation();
  }

  function priceForAmounts(baseAmount, quoteAmount) {
    if (!baseAmount || !quoteAmount) return 0n;
    var quoteX18 = quoteAmount * 1000000000000000000n / (10n ** BigInt(state.quoteDecimals));
    return quoteX18 * (10n ** BigInt(state.baseDecimals)) / baseAmount;
  }

  function orderLimitRange() {
    var limits = state.marketLimits;
    if (!limits || !limits.lastPrice || limits.lastPrice === 0n || !limits.priceRangePercent || limits.priceRangePercent === 0n) {
      return null;
    }
    return {
      lower: roundedPercentPrice(limits.lastPrice, 100n - limits.priceRangePercent),
      upper: roundedPercentPrice(limits.lastPrice, 100n + limits.priceRangePercent)
    };
  }

  function validateOrderInputs(options) {
    options = options || {};
    var form = app.querySelector('[data-order-form]');
    var messages = [];
    var result = { ok: false, messages: messages, baseAmount: null, quoteAmount: null, priceX18: 0n };
    if (!form || !state.market) return result;

    var rawBase = String(form.elements.baseAmount.value || '').trim();
    var rawQuote = String(form.elements.quoteAmount.value || '').trim();
    if (!rawBase && !rawQuote) {
      messages.push({ type: 'neutral', text: t('enterAmountsCheck') });
      return result;
    }

    var baseAmount = tryParseAmount(rawBase, state.baseDecimals);
    var quoteAmount = tryParseAmount(rawQuote, state.quoteDecimals);
    result.baseAmount = baseAmount;
    result.quoteAmount = quoteAmount;
    if (!baseAmount || !quoteAmount) {
      messages.push({ type: 'warn', text: t('validAmount') });
      return result;
    }

    if (!state.marketLimits) {
      messages.push({ type: 'neutral', text: t('marketLimitsLoading') });
      return result;
    }

    var sideText = state.side === 'buy' ? t('buySide') : t('sellSide');
    var quoteSymbol = state.market.symbols.quote;
    var baseSymbol = state.market.symbols.base;
    var limits = state.marketLimits;
    var minQuote = state.side === 'buy' ? limits.minQuoteBuyAmount : limits.minQuoteSellAmount;
    var maxQuote = state.side === 'buy' ? limits.maxQuoteBuyAmount : limits.maxQuoteSellAmount;
    var priceX18 = priceForAmounts(baseAmount, quoteAmount);
    var range = orderLimitRange();
    result.priceX18 = priceX18;

    if (limits.minBaseUnit > 0n && baseAmount % limits.minBaseUnit !== 0n) {
      messages.push({
        type: 'warn',
        text: templateText(t('baseStepCheck'), {
          amount: formatUnits(limits.minBaseUnit, state.baseDecimals, 9) + ' ' + baseSymbol
        })
      });
    }
    if (minQuote > 0n && quoteAmount < minQuote) {
      messages.push({
        type: 'warn',
        text: templateText(t('minQuoteCheck'), {
          side: sideText,
          amount: formatUnits(minQuote, state.quoteDecimals, 6) + ' ' + quoteSymbol
        })
      });
    }
    if (maxQuote > 0n && quoteAmount > maxQuote) {
      messages.push({
        type: 'warn',
        text: templateText(t('maxQuoteCheck'), {
          side: sideText,
          amount: formatUnits(maxQuote, state.quoteDecimals, 6) + ' ' + quoteSymbol
        })
      });
    }
    if (range && (priceX18 < range.lower || priceX18 > range.upper)) {
      messages.push({
        type: 'warn',
        text: templateText(t('priceOutOfRange'), {
          lower: priceText(range.lower),
          upper: priceText(range.upper)
        })
      });
    } else if (range) {
      messages.push({ type: 'ok', text: t('priceWithinRange') });
    }

    if (state.wallet) {
      if (state.side === 'buy' && state.quoteBalance != null && quoteAmount > state.quoteBalance) {
        messages.push({ type: 'warn', text: t('notEnoughQuote') });
      }
      if (state.side === 'sell' && state.baseBalance != null && baseAmount > state.baseBalance) {
        messages.push({ type: 'warn', text: t('notEnoughBase') });
      }
    } else if (options.requireWallet) {
      messages.push({ type: 'warn', text: t('connectFirst') });
    }

    result.ok = messages.every(function (message) {
      return message.type !== 'warn' && message.type !== 'neutral';
    });
    if (result.ok) messages.push({ type: 'ok', text: t('readyToSubmit') });
    return result;
  }

  function renderOrderValidation() {
    var checks = $(selectors.orderChecks);
    var submit = $(selectors.submitOrder);
    var validation = validateOrderInputs({ requireWallet: false });
    if (checks) {
      checks.innerHTML = validation.messages.map(function (message) {
        return '<div class="order-check ' + message.type + '">' + message.text + '</div>';
      }).join('');
    }
    if (submit) {
      submit.textContent = state.signer
        ? (state.side === 'buy' ? t('placeBuy') : t('placeSell'))
        : t('connectFirst');
      submit.disabled = state.isExecuting || !state.signer || !validation.ok;
    }
    return validation;
  }

  function setExecuting(message, enabled) {
    state.isExecuting = enabled;
    document.body.classList.toggle('is-executing', enabled);
    var overlay = $(selectors.executionOverlay);
    if (overlay) overlay.hidden = !enabled;
    if ($(selectors.executionTitle)) $(selectors.executionTitle).textContent = t('transactionProgress');
    if ($(selectors.executionMessage)) $(selectors.executionMessage).textContent = message || t('walletConfirm');
    renderOrderValidation();
  }

  async function withButtonLoading(button, task) {
    if (!button || button.disabled) return;
    var original = button.textContent;
    button.disabled = true;
    button.classList.add('loading');
    button.textContent = t('refreshingShort');
    try {
      await task();
      setStatus(t('refreshDone'), 'success');
    } finally {
      button.disabled = false;
      button.classList.remove('loading');
      button.textContent = original;
    }
  }

  function explorerTx(hash) {
    var base = state.market.chain.blockExplorerUrls && state.market.chain.blockExplorerUrls[0];
    return base ? base.replace(/\/$/, '') + '/tx/' + hash : '#';
  }

  function connectedRunner() {
    return state.signer || state.browserProvider || state.readProvider;
  }

  function renderMarketShell() {
    state.market = getMarket();
    if (!state.market) {
      setStatus(t('noMarket'), 'error');
      return;
    }

    setTextAll(selectors.pairLabel, state.market.symbols.base + ' / ' + state.market.symbols.quote);
    $(selectors.networkLabel).textContent = state.market.chain.name;
    setTextAll(selectors.baseSymbol, state.market.symbols.base);
    setTextAll(selectors.quoteSymbol, state.market.symbols.quote);
    updateOrderLabels();
  }

  function updateOrderLabels() {
    var base = state.market ? state.market.symbols.base : 'GLC';
    var quote = state.market ? state.market.symbols.quote : 'GLUSD';
    if ($(selectors.orderTitle)) {
      $(selectors.orderTitle).textContent = state.side === 'buy' ? t('buyTitle') + base : t('sellTitle') + base;
    }
    if ($(selectors.baseFieldLabel)) {
      $(selectors.baseFieldLabel).textContent = state.side === 'buy' ? base + t('toBuy') : base + t('toSell');
    }
    if ($(selectors.quoteFieldLabel)) {
      $(selectors.quoteFieldLabel).textContent = state.side === 'buy' ? quote + t('toPay') : quote + t('toReceive');
    }
    updateEnteredPrice();
  }

  async function connectOnboardWallet() {
    requireEthers();
    if (!window.GreatLoveAutoSwapOnboard || typeof window.GreatLoveAutoSwapOnboard.connect !== 'function') {
      throw new Error('Wallet connector is not loaded.');
    }
    var wallet = await window.GreatLoveAutoSwapOnboard.connect(config, state.market);
    state.provider = wallet.provider;
    state.walletLabel = wallet.label;
    state.browserProvider = new ethersLib.BrowserProvider(wallet.provider);
    state.signer = await state.browserProvider.getSigner();
    state.wallet = wallet.address || await state.signer.getAddress();
  }

  async function initContracts(contractRunner, options) {
    var abi = await loadAbi();
    var runner = contractRunner || state.signer || state.browserProvider || state.readProvider;
    if (!runner) throw new Error('No RPC provider is available.');
    var orderBook = new ethersLib.Contract(
      state.market.contracts.orderBook,
      abi.abi || abi,
      runner
    );
    var baseToken = new ethersLib.Contract(state.market.contracts.baseToken, ERC20_ABI, runner);
    var quoteToken = new ethersLib.Contract(state.market.contracts.quoteToken, ERC20_ABI, runner);
    if (options && options.write) {
      state.writeOrderBook = orderBook;
      state.writeBaseToken = baseToken;
      state.writeQuoteToken = quoteToken;
      return;
    }
    state.orderBook = orderBook;
    state.baseToken = baseToken;
    state.quoteToken = quoteToken;
  }

  async function initReadOnlyMarket() {
    if (!state.market) renderMarketShell();
    if (!state.market) return;
    if (!ethersLib) {
      setStatus(t('ethersMissing'), 'error');
      return;
    }
    if (isPlaceholderAddress(state.market.contracts.orderBook)) {
      setStatus(t('addressMissing'), 'error');
      return;
    }
    var rpcUrl = state.market.chain.rpcUrls && state.market.chain.rpcUrls[0];
    if (!rpcUrl) {
      setStatus(t('rpcMissing'), 'error');
      return;
    }
    state.readProvider = new ethersLib.JsonRpcProvider(rpcUrl, state.market.chain.chainId);
    await initContracts(state.readProvider);
    await refreshAll();
  }

  async function connect(method) {
    if (!state.market) renderMarketShell();
    if (!state.market) return;
    if (isPlaceholderAddress(state.market.contracts.orderBook)) {
      setStatus(t('addressMissing'), 'error');
      return;
    }

    setStatus(t('connecting'));
    await connectOnboardWallet();
    state.method = 'onboard';
    await initContracts(state.signer, { write: true });

    document.body.classList.add('is-connected');
    if ($(selectors.walletAddress)) $(selectors.walletAddress).textContent = state.wallet;
    $(selectors.networkLabel).textContent = state.market.chain.name + ' · ' + shorten(state.wallet);
    $(selectors.submitOrder).textContent = state.side === 'buy' ? t('placeBuy') : t('placeSell');
    setStatus(t('connected') + state.wallet, 'success');
    await refreshAll();
  }

  async function disconnectWallet() {
    if (window.GreatLoveAutoSwapOnboard && typeof window.GreatLoveAutoSwapOnboard.disconnect === 'function') {
      try {
        await window.GreatLoveAutoSwapOnboard.disconnect();
      } catch (err) {
        console.warn('Wallet connector disconnect failed', err);
      }
    } else if (state.provider && typeof state.provider.disconnect === 'function') {
      try {
        await state.provider.disconnect();
      } catch (err) {
        console.warn('Wallet disconnect failed', err);
      }
    }
    state.method = null;
    state.walletLabel = null;
    state.provider = null;
    state.browserProvider = null;
    state.signer = null;
    state.writeOrderBook = null;
    state.writeBaseToken = null;
    state.writeQuoteToken = null;
    state.wallet = '';
    document.body.classList.remove('is-connected');
    if ($(selectors.walletAddress)) $(selectors.walletAddress).textContent = '-';
    setTextAll(selectors.walletBaseBalance, '-');
    setTextAll(selectors.walletQuoteBalance, '-');
    if ($(selectors.myHistoryBody)) {
      $(selectors.myHistoryBody).innerHTML = '<tr><td colspan="3">' + t('connectMyHistory') + '</td></tr>';
    }
    state.baseBalance = null;
    state.quoteBalance = null;
    $(selectors.networkLabel).textContent = state.market ? state.market.chain.name : 'Not connected';
    $(selectors.submitOrder).textContent = t('connectFirst');
    await initContracts(state.readProvider);
    await refreshAll();
  }

  async function switchWallet() {
    await disconnectWallet();
    await connect('onboard');
  }

  async function readOrder(orderId) {
    var order = await state.orderBook.orders(orderId);
    return {
      id: order[0],
      maker: order[1],
      side: Number(order[2]) === 0 ? 'Buy' : 'Sell',
      priceX18: order[3],
      baseOriginal: order[4],
      quoteOriginal: order[5],
      baseRemaining: order[6],
      nextOrderId: order[7],
      active: order[11]
    };
  }

  async function fetchSide(isBuy) {
    var rows = [];
    var limitLevels = state.market.orderBook.priceLevelsPerSide || 12;
    var limitOrders = state.market.orderBook.ordersPerLevel || 8;
    var currentPrice = isBuy ? await state.orderBook.bestBidPrice() : await state.orderBook.bestAskPrice();
    var levels = 0;

    while (currentPrice !== 0n && levels < limitLevels) {
      levels++;
      var level = isBuy ? await state.orderBook.bidLevels(currentPrice) : await state.orderBook.askLevels(currentPrice);
      var orderId = level[0];
      var orders = 0;
      while (orderId !== 0n && orders < limitOrders) {
        orders++;
        var order = await readOrder(orderId);
        if (order.active && order.baseRemaining > 0n) rows.push(order);
        orderId = order.nextOrderId;
      }
      currentPrice = level[2];
    }
    return rows;
  }

  function orderRowHtml(order, baseDecimals, quoteDecimals, options) {
    options = options || {};
    var sideClass = order.side === 'Buy' ? 'buy' : 'sell';
    var actionHtml = '';
    if (state.signer) {
      actionHtml = '<button class="swap-button compact secondary" type="button" data-match-order="' + order.id.toString() + '">Match</button>';
      if (state.wallet && order.maker.toLowerCase() === state.wallet.toLowerCase()) {
        actionHtml += ' <button class="swap-button compact secondary" type="button" data-cancel-order="' + order.id.toString() + '">Cancel</button>';
      }
    }
    var quoteValue = quoteForBase(order.baseRemaining, order.priceX18, baseDecimals, quoteDecimals);
    return '<tr>' +
      '<td><span class="swap-pill ' + sideClass + '">' + order.side + '</span></td>' +
      '<td>' + order.id.toString() + '</td>' +
      '<td>' + priceText(order.priceX18) + '</td>' +
      '<td>' + formatUnits(order.baseRemaining, baseDecimals, 9) + ' ' + state.market.symbols.base + '</td>' +
      '<td>' + formatUnits(quoteValue, quoteDecimals, 9) + ' ' + state.market.symbols.quote + '</td>' +
      (options.hideMaker ? '' : '<td>' + shorten(order.maker) + '</td>') +
      '<td>' + actionHtml + '</td>' +
    '</tr>';
  }

  function renderOrders(rows, baseDecimals, quoteDecimals) {
    var body = $(selectors.ordersBody);
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="7">' + t('noOrders') + '</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (order) {
      return orderRowHtml(order, baseDecimals, quoteDecimals);
    }).join('');
  }

  function normalizeOrder(order) {
    return {
      id: order[0],
      maker: order[1],
      side: Number(order[2]) === 0 ? 'Buy' : 'Sell',
      priceX18: order[3],
      baseOriginal: order[4],
      quoteOriginal: order[5],
      baseRemaining: order[6],
      nextOrderId: order[7],
      active: order[11]
    };
  }

  async function refreshMyOrders() {
    var body = $(selectors.myOrdersBody);
    if (!body) return;
    if (!state.wallet || !state.orderBook) {
      body.innerHTML = '<tr><td colspan="6">' + t('connectMyOrders') + '</td></tr>';
      return;
    }
    body.innerHTML = '<tr><td colspan="6">' + t('loadingMyOrders') + '</td></tr>';
    var result = await Promise.all([
      state.orderBook.getActiveWalletOrders(state.wallet, 0),
      state.orderBook.getActiveWalletOrders(state.wallet, 1)
    ]);
    var orders = result.flat().map(normalizeOrder).filter(function (order) {
      return order.active && order.baseRemaining > 0n;
    }).sort(function (a, b) {
      return Number(b.id - a.id);
    });
    if (!orders.length) {
      body.innerHTML = '<tr><td colspan="6">' + t('noMyOrders') + '</td></tr>';
      return;
    }
    body.innerHTML = orders.map(function (order) {
      return orderRowHtml(order, state.baseDecimals, state.quoteDecimals, { hideMaker: true });
    }).join('');
  }

  async function refreshOpenOrders() {
    if (!state.orderBook) return;
    var rows = (await fetchSide(false)).concat(await fetchSide(true));
    renderOrders(rows, state.baseDecimals, state.quoteDecimals);
  }

  async function fetchHistoryEvents() {
    var historyConfig = state.market.history || {};
    var maxEvents = historyConfig.maxEvents || 25;
    var provider = state.readProvider || state.browserProvider;
    if (!provider) return [];
    var latestBlock = await provider.getBlockNumber();
    var scanBlocks = historyConfig.scanBlocks || 5000000;
    var chunkSize = historyConfig.chunkSize || 50000;
    var configuredFromBlock = historyConfig.fromBlock || 0;
    var floorBlock = Math.max(configuredFromBlock, latestBlock - scanBlocks);
    var events = [];
    var abi = await loadAbi();
    var iface = new ethersLib.Interface(abi.abi || abi);
    var eventTopics = [
      iface.getEvent('LimitOrderPosted').topicHash,
      iface.getEvent('OrderFilled').topicHash,
      iface.getEvent('OrderCanceled').topicHash
    ];

    for (var toBlock = latestBlock; toBlock >= floorBlock && events.length < maxEvents; toBlock -= chunkSize) {
      var fromBlock = Math.max(floorBlock, toBlock - chunkSize + 1);
      try {
        var logs = await provider.getLogs({
          address: state.market.contracts.orderBook,
          fromBlock: fromBlock,
          toBlock: toBlock,
          topics: [eventTopics]
        });
        logs.forEach(function (log) {
          try {
            var parsed = iface.parseLog(log);
            events.push({
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
              fragment: { name: parsed.name },
              args: parsed.args
            });
          } catch (err) {
            console.warn('Unable to decode AutoSwap log', err);
          }
        });
      } catch (err) {
        console.warn('History log query failed', err);
        if (chunkSize > 5000) {
          toBlock += chunkSize;
          chunkSize = Math.max(5000, Math.floor(chunkSize / 2));
          continue;
        }
      }
    }

    events = events.sort(function (a, b) {
      return Number(b.blockNumber || 0) - Number(a.blockNumber || 0);
    }).slice(0, maxEvents);
    return events;
  }

  function renderHistoryRows(body, events, emptyText) {
    if (!events.length) {
      body.innerHTML = '<tr><td colspan="3">' + emptyText + '</td></tr>';
      return;
    }

    body.innerHTML = events.map(function (event) {
      var args = event.args || {};
      var activity = t('activity');
      var detail = t('confirmedPolygon');
      if (event.fragment && event.fragment.name === 'LimitOrderPosted') {
        activity = args.isBuy ? t('buyOpened') : t('sellOpened');
        detail = '#' + args.orderId + t('orderAdded');
      } else if (event.fragment && event.fragment.name === 'OrderFilled') {
        activity = t('orderMatched');
        detail = 'Order #' + args.orderId + ' traded ' +
          formatUnits(args.baseAmount || 0n, state.baseDecimals, 6) + ' ' + state.market.symbols.base +
          t('forText') + formatUnits(args.quoteAmount || 0n, state.quoteDecimals, 6) + ' ' + state.market.symbols.quote + '.';
      } else if (event.fragment && event.fragment.name === 'OrderCanceled') {
        activity = t('orderCanceled');
        detail = '#' + args.orderId + t('wasCanceled');
      }
      return '<tr>' +
        '<td><a class="swap-link" href="' + explorerTx(event.transactionHash) + '" target="_blank" rel="noopener">' + shorten(event.transactionHash) + '</a></td>' +
        '<td><strong>' + activity + '</strong></td>' +
        '<td>' + detail + '</td>' +
      '</tr>';
    }).join('');
  }

  function eventBelongsToWallet(event) {
    if (!state.wallet || !event || !event.args) return false;
    var wallet = state.wallet.toLowerCase();
    var args = event.args;
    var maker = args.maker ? String(args.maker).toLowerCase() : '';
    var taker = args.taker ? String(args.taker).toLowerCase() : '';
    return maker === wallet || taker === wallet;
  }

  async function refreshMyHistory(events) {
    var body = $(selectors.myHistoryBody);
    if (!body) return;
    if (!state.wallet) {
      body.innerHTML = '<tr><td colspan="3">' + t('connectMyHistory') + '</td></tr>';
      return;
    }
    body.innerHTML = '<tr><td colspan="3">' + t('loadingMyHistory') + '</td></tr>';
    var historyEvents = events || await fetchHistoryEvents();
    renderHistoryRows(body, historyEvents.filter(eventBelongsToWallet), t('noMyHistory'));
  }

  async function refreshHistory() {
    var body = $(selectors.historyBody);
    if (!body) return;
    body.innerHTML = '<tr><td colspan="3">' + t('loadingHistory') + '</td></tr>';
    var events = await fetchHistoryEvents();
    state.historyHtml = events;
    renderHistoryRows(body, events, t('noHistory'));
    await refreshMyHistory(events);
  }

  async function refreshWalletBalances() {
    if (!state.wallet || !state.baseToken || !state.quoteToken) return;
    var balances = await Promise.all([
      state.baseToken.balanceOf(state.wallet),
      state.quoteToken.balanceOf(state.wallet)
    ]);
    state.baseBalance = balances[0];
    state.quoteBalance = balances[1];
    setTextAll(selectors.walletBaseBalance, formatUnits(balances[0], state.baseDecimals, 6));
    setTextAll(selectors.walletQuoteBalance, formatUnits(balances[1], state.quoteDecimals, 6));
    renderOrderValidation();
  }

  async function renderMarketLimits(bestBid, bestAsk) {
    var values = await Promise.all([
      state.orderBook.lastPrice(),
      state.orderBook.priceRangePercent(),
      state.orderBook.minQuoteBuyAmount(),
      state.orderBook.minQuoteSellAmount(),
      state.orderBook.maxQuoteBuyAmount(),
      state.orderBook.maxQuoteSellAmount(),
      state.orderBook.minBaseUnit()
    ]);
    var lastPrice = values[0];
    var priceRangePercent = values[1];
    var minBuy = values[2];
    var minSell = values[3];
    var maxBuy = values[4];
    var maxSell = values[5];
    var minBaseUnit = values[6];
    state.marketLimits = {
      lastPrice: lastPrice,
      priceRangePercent: priceRangePercent,
      minQuoteBuyAmount: minBuy,
      minQuoteSellAmount: minSell,
      maxQuoteBuyAmount: maxBuy,
      maxQuoteSellAmount: maxSell,
      minBaseUnit: minBaseUnit
    };
    $(selectors.lastPrice).textContent = priceText(lastPrice);
    if (priceRangePercent > 0n && lastPrice > 0n) {
      var lower = roundedPercentPrice(lastPrice, 100n - priceRangePercent);
      var upper = roundedPercentPrice(lastPrice, 100n + priceRangePercent);
      $(selectors.priceRange).textContent = priceText(lower) + ' - ' + priceText(upper);
    } else {
      $(selectors.priceRange).textContent = t('noLimit');
    }
    $(selectors.minBuy).textContent = minBuy > 0n ? formatUnits(minBuy, state.quoteDecimals, 6) + ' ' + state.market.symbols.quote : t('noMinimum');
    $(selectors.minSell).textContent = minSell > 0n ? formatUnits(minSell, state.quoteDecimals, 6) + ' ' + state.market.symbols.quote : t('noMinimum');
    $(selectors.maxBuy).textContent = maxBuy > 0n ? formatUnits(maxBuy, state.quoteDecimals, 6) + ' ' + state.market.symbols.quote : t('noMaximum');
    $(selectors.maxSell).textContent = maxSell > 0n ? formatUnits(maxSell, state.quoteDecimals, 6) + ' ' + state.market.symbols.quote : t('noMaximum');
    $(selectors.minBaseUnit).textContent = minBaseUnit > 0n ? formatUnits(minBaseUnit, state.baseDecimals, 6) + ' ' + state.market.symbols.base : t('noStepLimit');
    renderOrderValidation();
  }

  async function refreshMarket() {
    if (!state.orderBook) {
      renderMarketShell();
      return;
    }
    setStatus(t('refreshing'));
    var baseDecimals = Number(await state.orderBook.baseDecimals());
    var quoteDecimals = Number(await state.orderBook.quoteDecimals());
    state.baseDecimals = baseDecimals;
    state.quoteDecimals = quoteDecimals;
    var bestBid = await state.orderBook.bestBidPrice();
    var bestAsk = await state.orderBook.bestAskPrice();
    $(selectors.bestBid).textContent = priceText(bestBid);
    $(selectors.bestAsk).textContent = priceText(bestAsk);
    await renderMarketLimits(bestBid, bestAsk);
    await refreshWalletBalances();
    await refreshOpenOrders();
    await refreshMyOrders();
    setStatus(t('marketLoaded'), 'success');
  }

  async function refreshAll() {
    await refreshMarket();
    await refreshHistory();
    setStatus(t('marketLoaded'), 'success');
  }

  async function waitForConfirmation(tx) {
    if (!tx || !tx.hash) return null;
    if (state.readProvider && typeof state.readProvider.waitForTransaction === 'function') {
      return state.readProvider.waitForTransaction(tx.hash, 1);
    }
    return tx.wait();
  }

  function txResponse(hash) {
    return { hash: typeof hash === 'string' ? hash : (hash && hash.hash ? hash.hash : '') };
  }

  function quantityHex(value) {
    return ethersLib.toQuantity(value || 0n);
  }

  async function sendWalletTransaction(to, data, value) {
    if (!state.provider || typeof state.provider.request !== 'function' || !state.wallet) {
      throw new Error(t('chooseWallet'));
    }
    var tx = {
      from: state.wallet,
      to: to,
      data: data
    };
    if (value && value > 0n) tx.value = quantityHex(value);
    var hash = await state.provider.request({
      method: 'eth_sendTransaction',
      params: [tx]
    });
    var response = txResponse(hash);
    if (!response.hash) throw new Error('Wallet did not return a transaction hash.');
    return response;
  }

  async function sendTokenApproval(tokenRead, tokenAddress, owner, spender, amount) {
    var allowance = await tokenRead.allowance(owner, spender);
    if (allowance >= amount) return null;
    var tokenInterface = new ethersLib.Interface(ERC20_ABI);
    var tx = await sendWalletTransaction(
      tokenAddress,
      tokenInterface.encodeFunctionData('approve', [spender, amount]),
      0n
    );
    setStatus(t('approvalSubmitted') + tx.hash);
    await waitForConfirmation(tx);
    return tx.hash;
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (!state.signer || !state.provider) {
      setStatus(t('chooseWallet'), 'error');
      return;
    }
    setExecuting(t('marketLimitsLoading'), true);
    try {
      state.baseDecimals = Number(await state.orderBook.baseDecimals());
      state.quoteDecimals = Number(await state.orderBook.quoteDecimals());
      await renderMarketLimits();
      await refreshWalletBalances();
      var validation = validateOrderInputs({ requireWallet: true });
      renderOrderValidation();
      if (!validation.ok) {
        var firstWarning = validation.messages.find(function (message) {
          return message.type === 'warn';
        });
        setStatus((firstWarning && firstWarning.text) || t('validAmount'), 'error');
        return;
      }
      var baseAmount = validation.baseAmount;
      var quoteAmount = validation.quoteAmount;
      var recipient = state.wallet;
      var payment = state.side === 'buy' ? await state.orderBook.buyPayment() : await state.orderBook.sellPayment();
      setStatus(t('checkingApproval'));
      if (state.side === 'buy') {
        setExecuting(t('executingBuy'), true);
        await sendTokenApproval(state.quoteToken, state.market.contracts.quoteToken, state.wallet, state.market.contracts.orderBook, quoteAmount);
        setStatus(t('submittingBuy'));
        var buyTx = await sendWalletTransaction(
          state.market.contracts.orderBook,
          state.orderBook.interface.encodeFunctionData('placeLimitBuyCrossThenPost', [quoteAmount, baseAmount, recipient]),
          payment
        );
        setStatus(t('buySubmitted') + buyTx.hash);
        await waitForConfirmation(buyTx);
      } else {
        setExecuting(t('executingSell'), true);
        await sendTokenApproval(state.baseToken, state.market.contracts.baseToken, state.wallet, state.market.contracts.orderBook, baseAmount);
        setStatus(t('submittingSell'));
        var sellTx = await sendWalletTransaction(
          state.market.contracts.orderBook,
          state.orderBook.interface.encodeFunctionData('placeLimitSellCrossThenPost', [baseAmount, quoteAmount, recipient]),
          payment
        );
        setStatus(t('sellSubmitted') + sellTx.hash);
        await waitForConfirmation(sellTx);
      }
      setStatus(t('confirmedRefreshing'), 'success');
      await new Promise(function (resolve) { setTimeout(resolve, 1200); });
      await refreshAll();
    } finally {
      setExecuting('', false);
    }
  }

  async function matchOrder(orderId) {
    if (!state.signer || !state.provider) {
      setStatus(t('chooseWallet'), 'error');
      return;
    }
    var order = await readOrder(BigInt(orderId));
    if (!order.active || order.baseRemaining === 0n) throw new Error(t('orderInactive'));
    var baseDecimals = Number(await state.orderBook.baseDecimals());
    var quoteDecimals = Number(await state.orderBook.quoteDecimals());
    var quoteAmount = quoteForBase(order.baseRemaining, order.priceX18, baseDecimals, quoteDecimals);
    var makerOrderIsBuy = order.side === 'Buy';
    var takerIsBuy = !makerOrderIsBuy;
    var payment = takerIsBuy ? await state.orderBook.buyPayment() : await state.orderBook.sellPayment();

    setExecuting(t('executingMatch'), true);
    try {
      setStatus(t('checkingMatchApproval'));
      if (takerIsBuy) {
        await sendTokenApproval(state.quoteToken, state.market.contracts.quoteToken, state.wallet, state.market.contracts.orderBook, quoteAmount);
      } else {
        await sendTokenApproval(state.baseToken, state.market.contracts.baseToken, state.wallet, state.market.contracts.orderBook, order.baseRemaining);
      }
      setStatus(t('submittingMatch'));
      var tx = await sendWalletTransaction(
        state.market.contracts.orderBook,
        state.orderBook.interface.encodeFunctionData('matchOrder', [order.id, order.baseRemaining, state.wallet]),
        payment
      );
      setStatus(t('matchSubmitted') + tx.hash + ' · ' + formatUnits(order.baseRemaining, baseDecimals, 9) + ' ' + state.market.symbols.base);
      await waitForConfirmation(tx);
      setStatus(t('matchConfirmed'), 'success');
      await new Promise(function (resolve) { setTimeout(resolve, 1200); });
      await refreshAll();
    } finally {
      setExecuting('', false);
    }
  }

  async function cancelOrder(orderId) {
    if (!state.signer || !state.provider) {
      setStatus(t('chooseWallet'), 'error');
      return;
    }
      setExecuting(t('executingCancel'), true);
    try {
      setStatus(t('submittingCancel'));
      var tx = await sendWalletTransaction(
        state.market.contracts.orderBook,
        state.orderBook.interface.encodeFunctionData('cancelOrder', [BigInt(orderId)]),
        0n
      );
      setStatus(t('cancelSubmitted') + tx.hash);
      await waitForConfirmation(tx);
      setStatus(t('cancelConfirmed'), 'success');
      await new Promise(function (resolve) { setTimeout(resolve, 1200); });
      await refreshAll();
    } finally {
      setExecuting('', false);
    }
  }

  function bindEvents() {
    app.querySelectorAll('[data-wallet-method]').forEach(function (button) {
      button.addEventListener('click', function () {
        var method = button.getAttribute('data-wallet-method');
        connect(method).catch(function (err) {
          setStatus(err.message || String(err), 'error');
        });
      });
    });

    app.querySelectorAll('[data-side]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.side = button.getAttribute('data-side');
        app.querySelectorAll('[data-side]').forEach(function (tab) {
          tab.classList.toggle('active', tab === button);
        });
        var submit = $(selectors.submitOrder);
        submit.classList.toggle('sell', state.side === 'sell');
        submit.textContent = state.signer
          ? (state.side === 'buy' ? t('placeBuy') : t('placeSell'))
          : t('connectFirst');
        updateOrderLabels();
      });
    });

    var form = app.querySelector('[data-order-form]');
    form.elements.baseAmount.addEventListener('input', updateEnteredPrice);
    form.elements.quoteAmount.addEventListener('input', updateEnteredPrice);
    form.addEventListener('submit', function (event) {
      submitOrder(event).catch(function (err) {
        setStatus(err.message || String(err), 'error');
      });
    });

    app.querySelector('[data-refresh-market]').addEventListener('click', function (event) {
      withButtonLoading(event.currentTarget, refreshMarket).catch(function (err) {
        setStatus(err.message || String(err), 'error');
      });
    });

    app.querySelector('[data-refresh-open-orders]').addEventListener('click', function (event) {
      withButtonLoading(event.currentTarget, refreshOpenOrders).catch(function (err) {
        setStatus(err.message || String(err), 'error');
      });
    });

    app.querySelector('[data-refresh-my-orders]').addEventListener('click', function (event) {
      withButtonLoading(event.currentTarget, refreshMyOrders).catch(function (err) {
        setStatus(err.message || String(err), 'error');
      });
    });

    app.querySelector('[data-refresh-my-history]').addEventListener('click', function (event) {
      withButtonLoading(event.currentTarget, refreshMyHistory).catch(function (err) {
        setStatus(err.message || String(err), 'error');
      });
    });

    app.querySelector('[data-refresh-history]').addEventListener('click', function (event) {
      withButtonLoading(event.currentTarget, refreshHistory).catch(function (err) {
        setStatus(err.message || String(err), 'error');
      });
    });

    app.querySelector('[data-disconnect-wallet]').addEventListener('click', function () {
      disconnectWallet().catch(function (err) {
        setStatus(err.message || String(err), 'error');
      });
    });

    app.querySelector('[data-switch-wallet]').addEventListener('click', function () {
      switchWallet().catch(function (err) {
        setStatus(err.message || String(err), 'error');
      });
    });

    function bindOrderActions(body) {
      if (!body) return;
      body.addEventListener('click', function (event) {
        var matchButton = event.target.closest('[data-match-order]');
        if (matchButton) {
          matchOrder(matchButton.getAttribute('data-match-order')).catch(function (err) {
            setStatus(err.message || String(err), 'error');
          });
          return;
        }
        var cancelButton = event.target.closest('[data-cancel-order]');
        if (!cancelButton) return;
        cancelOrder(cancelButton.getAttribute('data-cancel-order')).catch(function (err) {
          setStatus(err.message || String(err), 'error');
        });
      });
    }

    bindOrderActions($(selectors.ordersBody));
    bindOrderActions($(selectors.myOrdersBody));
  }

  renderMarketShell();
  bindEvents();
  initReadOnlyMarket().catch(function (err) {
    setStatus(err.message || String(err), 'error');
  });
})();
