(function () {
  'use strict';

  var app = document.querySelector('[data-stableswap-app]');
  if (!app) return;

  var ethersLib = window.ethers;
  var config = window.GREATLOVE_STABLESWAP_CONFIG || {};
  var pageLang = document.documentElement.lang === 'en' || /^\/en(?:\/|$)/i.test(window.location.pathname) ? 'en' : 'zh';
  var I18N = {
    en: {
      ethersMissing: 'ethers library did not load.',
      configMissing: 'StableSwap config is missing.',
      addressMissing: 'Add the StableSwap contract address in assets/config/stableswap.config.js.',
      rpcMissing: 'RPC URL is missing in assets/config/stableswap.config.js.',
      connectWallet: 'Connect Wallet',
      connecting: 'Connecting wallet...',
      connected: 'Wallet connected.',
      disconnected: 'Wallet disconnected.',
      connectFirst: 'Connect wallet first.',
      loading: 'Loading swap data...',
      loaded: 'Swap data loaded.',
      enterAmount: 'Enter a USDT amount.',
      invalidAmount: 'Enter a valid USDT amount.',
      insufficientUsdt: 'Insufficient USDT balance.',
      insufficientLiquidity: 'StableSwap contract does not have enough GLUSD liquidity.',
      ready: 'Ready to swap.',
      approving: 'Checking USDT approval...',
      approvalSubmitted: 'USDT approval submitted: ',
      swapping: 'Swapping USDT to GLUSD. Please confirm in your wallet.',
      submitted: 'Swap submitted: ',
      confirmed: 'Swap confirmed. Refreshing data...',
      refreshHistory: 'Refreshing your history...',
      noWalletHistory: 'Connect wallet to view your recent swaps.',
      noHistory: 'No USDT to GLUSD swaps found for this wallet.',
      historyLoaded: 'History updated.',
      executionTitle: 'Transaction in progress',
      executionMessage: 'Confirm in your wallet and wait for Polygon confirmation.'
    },
    zh: {
      ethersMissing: 'ethers 库未加载。',
      configMissing: 'StableSwap 配置未加载。',
      addressMissing: '请在 assets/config/stableswap.config.js 中填写 StableSwap 合约地址。',
      rpcMissing: 'assets/config/stableswap.config.js 中缺少 RPC URL。',
      connectWallet: '连接钱包',
      connecting: '正在连接钱包...',
      connected: '钱包已连接。',
      disconnected: '钱包已断开。',
      connectFirst: '请先连接钱包。',
      loading: '正在加载兑换数据...',
      loaded: '兑换数据已加载。',
      enterAmount: '请输入 USDT 数量。',
      invalidAmount: '请输入有效的 USDT 数量。',
      insufficientUsdt: 'USDT 余额不足。',
      insufficientLiquidity: 'StableSwap 合约 GLUSD 流动性不足。',
      ready: '可以兑换。',
      approving: '正在检查 USDT 授权...',
      approvalSubmitted: 'USDT 授权交易已提交：',
      swapping: '正在兑换 USDT 到 GLUSD，请在钱包中确认。',
      submitted: '兑换交易已提交：',
      confirmed: '兑换已确认，正在刷新数据...',
      refreshHistory: '正在刷新你的历史记录...',
      noWalletHistory: '连接钱包后查看你的最近兑换。',
      noHistory: '该钱包暂无 USDT 到 GLUSD 兑换记录。',
      historyLoaded: '历史记录已更新。',
      executionTitle: '交易执行中',
      executionMessage: '请在钱包中确认，并等待 Polygon 确认。'
    }
  };

  var ERC20_ABI = [
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 value) returns (bool)'
  ];
  var STABLESWAP_ABI = [
    'function TOKEN1() view returns (address)',
    'function TOKEN2() view returns (address)',
    'function getQuote(uint256 tokenAmount, uint8 orderType) view returns (uint256)',
    'function swap(uint256 tokenAmount, uint8 orderType) payable',
    'function transactionFee() view returns (uint256)',
    'function token2Balance() view returns (uint256)',
    'function swapFeePercentage() view returns (uint256)',
    'function PERCENTAGE_BASE() view returns (uint256)',
    'event Swapped(address indexed user, uint8 indexed orderType, uint256 inputAmount, uint256 outputAmount)'
  ];

  var state = {
    provider: null,
    readProvider: null,
    browserProvider: null,
    signer: null,
    wallet: '',
    stableSwap: null,
    usdtToken: null,
    glusdToken: null,
    payDecimals: 6,
    receiveDecimals: 18,
    payBalance: 0n,
    receiveBalance: 0n,
    liquidity: 0n,
    txFee: 0n,
    swapFeePercentage: 0n,
    percentageBase: 10000n,
    quoteAmount: 0n,
    isExecuting: false
  };

  var selectors = {
    status: '[data-status]',
    walletAddress: '[data-wallet-address]',
    payBalance: '[data-pay-balance]',
    receiveBalance: '[data-receive-balance]',
    payAmount: '[data-pay-amount]',
    receiveAmount: '[data-receive-amount]',
    swapButton: '[data-swap-button]',
    checks: '[data-checks]',
    rate: '[data-rate]',
    txFee: '[data-tx-fee]',
    liquidity: '[data-liquidity]',
    swapFee: '[data-swap-fee]',
    historyBody: '[data-history-body]',
    executionOverlay: '[data-execution-overlay]'
  };

  function t(key) {
    return (I18N[pageLang] && I18N[pageLang][key]) || I18N.en[key] || key;
  }

  function $(selector) {
    return app.querySelector(selector);
  }

  function setAll(selector, text) {
    app.querySelectorAll(selector).forEach(function (node) {
      node.textContent = text;
    });
  }

  function setStatus(message, type) {
    var node = $(selectors.status);
    if (!node) return;
    node.textContent = message;
    node.classList.remove('error', 'success');
    if (type) node.classList.add(type);
  }

  function setExecuting(active) {
    state.isExecuting = active;
    document.body.classList.toggle('is-stableswap-executing', active);
    var overlay = $(selectors.executionOverlay);
    if (overlay) overlay.hidden = !active;
    var button = $(selectors.swapButton);
    if (button) button.disabled = active;
  }

  function shorten(value) {
    if (!value || value.length < 14) return value || '';
    return value.slice(0, 6) + '...' + value.slice(-4);
  }

  function isAddress(value) {
    return ethersLib && ethersLib.isAddress(value || '');
  }

  function hasContractAddress() {
    return isAddress(config.contracts && config.contracts.stableSwap);
  }

  function explorerTx(hash) {
    var base = config.chain && config.chain.blockExplorerUrls && config.chain.blockExplorerUrls[0];
    return (base || 'https://polygonscan.com') + '/tx/' + hash;
  }

  function formatUnits(value, decimals, precision) {
    try {
      var text = ethersLib.formatUnits(value || 0n, decimals);
      var parts = text.split('.');
      if (!parts[1] || precision == null) return parts[0];
      var frac = parts[1].slice(0, precision).replace(/0+$/, '');
      return frac ? parts[0] + '.' + frac : parts[0];
    } catch (err) {
      return '0';
    }
  }

  function parseAmount(value, decimals) {
    var cleaned = String(value || '').trim();
    if (!cleaned || !/^\d*(\.\d*)?$/.test(cleaned) || cleaned === '.') return 0n;
    return ethersLib.parseUnits(cleaned, decimals);
  }

  function quantityHex(value) {
    return ethersLib.toQuantity(value || 0n);
  }

  function walletTopic(address) {
    return ethersLib.zeroPadValue(address, 32);
  }

  function renderBalances() {
    var pay = formatUnits(state.payBalance, state.payDecimals, 6);
    var receive = formatUnits(state.receiveBalance, state.receiveDecimals, 6);
    var liquidity = formatUnits(state.liquidity, state.receiveDecimals, 6);
    setAll(selectors.payBalance, pay + ' ' + config.symbols.pay);
    setAll(selectors.receiveBalance, receive + ' ' + config.symbols.receive);
    $(selectors.liquidity).textContent = liquidity + ' ' + config.symbols.receive;
    $(selectors.txFee).textContent = formatUnits(state.txFee, 18, 8) + ' ' + (config.chain.nativeCurrency.symbol || 'POL');
    if (state.percentageBase > 0n) {
      var fee = Number(state.swapFeePercentage) / Number(state.percentageBase) * 100;
      $(selectors.swapFee).textContent = fee.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + '%';
    }
  }

  function renderWallet() {
    document.body.classList.toggle('is-stableswap-connected', !!state.wallet);
    var walletAddress = $(selectors.walletAddress);
    if (walletAddress) walletAddress.textContent = state.wallet ? shorten(state.wallet) : '';
  }

  function renderValidation() {
    var node = $(selectors.checks);
    var button = $(selectors.swapButton);
    var amount = 0n;
    try {
      amount = parseAmount($(selectors.payAmount).value, state.payDecimals);
    } catch (err) {
      amount = 0n;
    }
    var messages = [];
    var ok = true;
    if (!state.wallet) {
      ok = false;
      messages.push(t('connectFirst'));
    } else if (amount <= 0n) {
      ok = false;
      messages.push(t('enterAmount'));
    } else if (amount > state.payBalance) {
      ok = false;
      messages.push(t('insufficientUsdt'));
    } else if (state.quoteAmount > state.liquidity) {
      ok = false;
      messages.push(t('insufficientLiquidity'));
    } else {
      messages.push(t('ready'));
    }
    node.innerHTML = messages.map(function (message) {
      return '<li class="' + (ok ? 'ok' : 'warn') + '">' + message + '</li>';
    }).join('');
    if (button) button.disabled = !ok || state.isExecuting || !hasContractAddress();
  }

  async function loadContracts() {
    if (!ethersLib) throw new Error(t('ethersMissing'));
    if (!config || !config.contracts) throw new Error(t('configMissing'));
    if (!hasContractAddress()) throw new Error(t('addressMissing'));
    var rpcUrl = config.chain && config.chain.rpcUrls && config.chain.rpcUrls[0];
    if (!rpcUrl) throw new Error(t('rpcMissing'));
    state.readProvider = new ethersLib.JsonRpcProvider(rpcUrl, Number(config.chain.chainId || 137));
    state.stableSwap = new ethersLib.Contract(config.contracts.stableSwap, STABLESWAP_ABI, state.readProvider);
    state.usdtToken = new ethersLib.Contract(config.contracts.usdtToken, ERC20_ABI, state.readProvider);
    state.glusdToken = new ethersLib.Contract(config.contracts.glusdToken, ERC20_ABI, state.readProvider);
    state.payDecimals = Number(await state.usdtToken.decimals());
    state.receiveDecimals = Number(await state.glusdToken.decimals());
  }

  async function refreshStaticData() {
    if (!state.stableSwap) return;
    state.txFee = await state.stableSwap.transactionFee();
    state.liquidity = await state.stableSwap.token2Balance();
    try {
      state.swapFeePercentage = await state.stableSwap.swapFeePercentage();
      state.percentageBase = await state.stableSwap.PERCENTAGE_BASE();
    } catch (err) {
      state.swapFeePercentage = 0n;
      state.percentageBase = 10000n;
    }
    renderBalances();
  }

  async function refreshWalletBalances() {
    if (!state.wallet || !state.usdtToken || !state.glusdToken) {
      renderBalances();
      return;
    }
    state.payBalance = await state.usdtToken.balanceOf(state.wallet);
    state.receiveBalance = await state.glusdToken.balanceOf(state.wallet);
    renderBalances();
    renderValidation();
  }

  async function refreshQuote() {
    if (!state.stableSwap) return;
    var amount = parseAmount($(selectors.payAmount).value, state.payDecimals);
    state.quoteAmount = amount > 0n ? await state.stableSwap.getQuote(amount, 0) : 0n;
    $(selectors.receiveAmount).value = state.quoteAmount > 0n ? formatUnits(state.quoteAmount, state.receiveDecimals, 8) : '';
    $(selectors.rate).textContent = amount > 0n
      ? '1 ' + config.symbols.pay + ' = ' + formatUnits(state.quoteAmount * (10n ** BigInt(state.payDecimals)) / amount, state.receiveDecimals, 8) + ' ' + config.symbols.receive
      : '1 ' + config.symbols.pay + ' = 1 ' + config.symbols.receive;
    renderValidation();
  }

  async function sendWalletTransaction(to, data, value) {
    if (!state.provider || typeof state.provider.request !== 'function' || !state.wallet) {
      throw new Error(t('connectFirst'));
    }
    var tx = { from: state.wallet, to: to, data: data };
    if (value && value > 0n) tx.value = quantityHex(value);
    var hash = await state.provider.request({ method: 'eth_sendTransaction', params: [tx] });
    if (!hash) throw new Error('Wallet did not return a transaction hash.');
    return { hash: hash };
  }

  async function waitForConfirmation(tx) {
    if (!tx || !tx.hash) return null;
    return state.readProvider.waitForTransaction(tx.hash, 1);
  }

  async function ensureApproval(amount) {
    var allowance = await state.usdtToken.allowance(state.wallet, config.contracts.stableSwap);
    if (allowance >= amount) return;
    var tokenInterface = new ethersLib.Interface(ERC20_ABI);
    var tx = await sendWalletTransaction(
      config.contracts.usdtToken,
      tokenInterface.encodeFunctionData('approve', [config.contracts.stableSwap, amount]),
      0n
    );
    setStatus(t('approvalSubmitted') + tx.hash);
    await waitForConfirmation(tx);
  }

  async function submitSwap(event) {
    event.preventDefault();
    if (!state.wallet) {
      setStatus(t('connectFirst'), 'error');
      return;
    }
    var amount;
    try {
      amount = parseAmount($(selectors.payAmount).value, state.payDecimals);
    } catch (err) {
      setStatus(t('invalidAmount'), 'error');
      return;
    }
    await refreshQuote();
    await refreshWalletBalances();
    if (amount <= 0n || amount > state.payBalance || state.quoteAmount > state.liquidity) {
      renderValidation();
      setStatus(amount > state.payBalance ? t('insufficientUsdt') : t('invalidAmount'), 'error');
      return;
    }
    setExecuting(true);
    try {
      setStatus(t('approving'));
      await ensureApproval(amount);
      setStatus(t('swapping'));
      var tx = await sendWalletTransaction(
        config.contracts.stableSwap,
        state.stableSwap.interface.encodeFunctionData('swap', [amount, 0]),
        state.txFee
      );
      setStatus(t('submitted') + tx.hash);
      await waitForConfirmation(tx);
      setStatus(t('confirmed'), 'success');
      await new Promise(function (resolve) { setTimeout(resolve, 1200); });
      await refreshStaticData();
      await refreshWalletBalances();
      await refreshHistory();
      await refreshQuote();
    } catch (err) {
      setStatus(err.message || String(err), 'error');
    } finally {
      setExecuting(false);
    }
  }

  async function refreshHistory() {
    var body = $(selectors.historyBody);
    if (!body) return;
    if (!state.wallet) {
      body.innerHTML = '<tr><td colspan="3" class="empty">' + t('noWalletHistory') + '</td></tr>';
      return;
    }
    setStatus(t('refreshHistory'));
    var latest = await state.readProvider.getBlockNumber();
    var historyConfig = config.history || {};
    var scanBlocks = Number(historyConfig.scanBlocks || 5000000);
    var chunkSize = Number(historyConfig.chunkSize || 50000);
    var maxEvents = Number(historyConfig.maxEvents || 20);
    var fromBlock = Math.max(0, latest - scanBlocks);
    var iface = new ethersLib.Interface(STABLESWAP_ABI);
    var event = iface.getEvent('Swapped');
    var rows = [];
    for (var to = latest; to >= fromBlock && rows.length < maxEvents; to -= chunkSize) {
      var from = Math.max(fromBlock, to - chunkSize + 1);
      var logs = await state.readProvider.getLogs({
        address: config.contracts.stableSwap,
        fromBlock: from,
        toBlock: to,
        topics: [event.topicHash, walletTopic(state.wallet)]
      });
      for (var i = logs.length - 1; i >= 0 && rows.length < maxEvents; i--) {
        var parsed = iface.parseLog(logs[i]);
        if (Number(parsed.args.orderType) !== 0) continue;
        rows.push({
          hash: logs[i].transactionHash,
          paid: parsed.args.inputAmount,
          received: parsed.args.outputAmount
        });
      }
    }
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="3" class="empty">' + t('noHistory') + '</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (row) {
      return '<tr><td><a class="tx-link" target="_blank" rel="noopener" href="' + explorerTx(row.hash) + '">' + shorten(row.hash) + '</a></td><td>' +
        formatUnits(row.paid, state.payDecimals, 6) + ' ' + config.symbols.pay + '</td><td>' +
        formatUnits(row.received, state.receiveDecimals, 6) + ' ' + config.symbols.receive + '</td></tr>';
    }).join('');
    setStatus(t('historyLoaded'), 'success');
  }

  async function connectWallet() {
    if (!window.GreatLoveAutoSwapOnboard) throw new Error('Wallet connector did not load.');
    setStatus(t('connecting'));
    var result = await window.GreatLoveAutoSwapOnboard.connect(config, { chain: config.chain });
    state.provider = result.provider;
    state.wallet = result.address;
    state.browserProvider = new ethersLib.BrowserProvider(state.provider);
    state.signer = await state.browserProvider.getSigner();
    renderWallet();
    await refreshStaticData();
    await refreshWalletBalances();
    await refreshHistory();
    await refreshQuote();
    setStatus(t('connected'), 'success');
  }

  async function disconnectWallet() {
    if (window.GreatLoveAutoSwapOnboard) await window.GreatLoveAutoSwapOnboard.disconnect();
    state.provider = null;
    state.browserProvider = null;
    state.signer = null;
    state.wallet = '';
    state.payBalance = 0n;
    state.receiveBalance = 0n;
    renderWallet();
    renderBalances();
    renderValidation();
    await refreshHistory();
    setStatus(t('disconnected'), 'success');
  }

  function bindEvents() {
    app.querySelectorAll('[data-connect-wallet]').forEach(function (button) {
      button.addEventListener('click', function () {
        connectWallet().catch(function (err) { setStatus(err.message || String(err), 'error'); });
      });
    });
    app.querySelectorAll('[data-disconnect-wallet]').forEach(function (button) {
      button.addEventListener('click', function () {
        disconnectWallet().catch(function (err) { setStatus(err.message || String(err), 'error'); });
      });
    });
    $(selectors.payAmount).addEventListener('input', function () {
      refreshQuote().catch(function (err) { setStatus(err.message || String(err), 'error'); });
    });
    $(selectors.swapButton).addEventListener('click', submitSwap);
    app.querySelectorAll('[data-refresh-history]').forEach(function (button) {
      button.addEventListener('click', function () {
        refreshHistory().catch(function (err) { setStatus(err.message || String(err), 'error'); });
      });
    });
  }

  async function init() {
    bindEvents();
    renderWallet();
    renderValidation();
    try {
      await loadContracts();
      await refreshStaticData();
      await refreshQuote();
      await refreshHistory();
      setStatus(t('loaded'), 'success');
    } catch (err) {
      setStatus(err.message || String(err), 'error');
      renderValidation();
    }
  }

  init();
})();
