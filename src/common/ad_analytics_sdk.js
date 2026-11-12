/**
 * TrendMiniGames Ad Monetization, A/B Testing & Telemetry SDK
 * - ゲーム内広告（忍者AdMax本番タグ / リワード動画風インタースティシャル / 文脈連動アフィリエイト）の描画
 * - A/Bテストバリアント自動割り当て（Variant A: 損失回避訴求 vs Variant B: 報酬獲得訴求）
 * - インプレッション・プレイ時間・リトライ率・広告CTR・推定収益の計測＆サーバー同期
 */
class MiniGameMonetizationSDK {
  constructor(themeData, monetizationConfig) {
    this.theme = themeData;
    this.config = monetizationConfig;
    this.slug = themeData.slug;
    this.variant = this.assignABVariant();
    this.sessionStart = Date.now();
    this.rewardClaimed = false;
    this.currentScore = 0;

    this.initStorage();
    this.renderBannerSlots();
    this.trackEvent('impression', { variant: this.variant });
  }

  assignABVariant() {
    const key = 'tmg_ab_variant';
    let saved = localStorage.getItem(key);
    if (!saved || (saved !== 'A' && saved !== 'B')) {
      saved = Math.random() < 0.5 ? 'A' : 'B';
      localStorage.setItem(key, saved);
    }
    return saved;
  }

  initStorage() {
    const raw = localStorage.getItem('tmg_analytics_v1');
    if (!raw) {
      localStorage.setItem('tmg_analytics_v1', JSON.stringify({ games: {}, events: [] }));
    }
  }

  getAnalyticsStore() {
    try {
      return JSON.parse(localStorage.getItem('tmg_analytics_v1')) || { games: {}, events: [] };
    } catch (e) {
      return { games: {}, events: [] };
    }
  }

  saveAnalyticsStore(store) {
    localStorage.setItem('tmg_analytics_v1', JSON.stringify(store));
  }

  trackEvent(eventType, payload = {}) {
    const store = this.getAnalyticsStore();
    if (!store.games[this.slug]) {
      store.games[this.slug] = {
        impressions: 0,
        plays: 0,
        gameovers: 0,
        retries: 0,
        reward_views: 0,
        ad_clicks: 0,
        affiliate_clicks: 0,
        shares: 0,
        total_play_sec: 0,
        high_score: 0,
        ab_stats: {
          A: { result_views: 0, clicks: 0 },
          B: { result_views: 0, clicks: 0 }
        }
      };
    }

    const g = store.games[this.slug];
    const v = this.variant;

    if (eventType === 'impression') g.impressions++;
    if (eventType === 'play_start') g.plays++;
    if (eventType === 'retry') g.retries++;
    if (eventType === 'gameover') {
      g.gameovers++;
      g.total_play_sec += (payload.duration_sec || 30);
      if ((payload.score || 0) > g.high_score) g.high_score = payload.score;
      if (g.ab_stats[v]) g.ab_stats[v].result_views++;
    }
    if (eventType === 'reward_ad_view') g.reward_views++;
    if (eventType === 'banner_click') g.ad_clicks++;
    if (eventType === 'affiliate_click') {
      g.affiliate_clicks++;
      if (g.ab_stats[v]) g.ab_stats[v].clicks++;
    }
    if (eventType === 'share_click') g.shares++;

    store.events.push({
      ts: new Date().toISOString(),
      slug: this.slug,
      type: eventType,
      variant: v,
      ...payload
    });
    if (store.events.length > 300) {
      store.events = store.events.slice(-300);
    }

    this.saveAnalyticsStore(store);

    if (window.location.protocol.startsWith('http') && window.location.hostname === 'localhost') {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: this.slug,
          event: eventType,
          variant: v,
          payload
        })
      }).catch(() => {});
    }
  }

  extractNinjaSrc(tagOrId) {
    if (!tagOrId || tagOrId.includes('DEMO')) return null;
    const match = tagOrId.match(/https:\/\/adm\.shinobi\.jp\/s\/[a-zA-Z0-9_\/]+/);
    if (match) return match[0];
    return null;
  }

  injectNinjaScript(container, scriptUrl) {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    const s = document.createElement('script');
    s.src = scriptUrl;
    wrapper.appendChild(s);
    container.appendChild(wrapper);
  }

  renderBannerSlots() {
    const ninjaCfg = (this.config.ad_networks && this.config.ad_networks.ninja_admax) || {};
    const headerNinjaUrl = this.extractNinjaSrc(ninjaCfg.header_banner_tag_id);
    const footerNinjaUrl = this.extractNinjaSrc(ninjaCfg.footer_banner_tag_id) || headerNinjaUrl;

    const primaryOffer = (this.theme.affiliate_offers && this.theme.affiliate_offers[0]) || {
      title: '【PR】今話題のトレンドサービスをチェック！',
      cta_text: '詳細を見る',
      url: '#affiliate'
    };
    const secondaryOffer = (this.theme.affiliate_offers && this.theme.affiliate_offers[1]) || primaryOffer;

    const topSlot = document.getElementById('topAdBanner');
    if (topSlot) {
      if (headerNinjaUrl) {
        topSlot.removeAttribute('href');
        this.injectNinjaScript(topSlot, headerNinjaUrl);
      } else {
        topSlot.href = primaryOffer.url;
        topSlot.target = '_blank';
        topSlot.rel = 'noopener noreferrer';
        topSlot.innerHTML = `
          <span class="ad-pr-badge">PR・忍者AdMax枠</span>
          <span class="ad-banner-text">${primaryOffer.title}</span>
          <span class="ad-banner-cta">${primaryOffer.cta_text}</span>
        `;
      }
      topSlot.addEventListener('click', () => {
        this.trackEvent('banner_click', { slot: 'header', offer_id: primaryOffer.offer_id });
      });
    }

    const bottomSlot = document.getElementById('bottomAdBanner');
    if (bottomSlot) {
      if (footerNinjaUrl) {
        bottomSlot.removeAttribute('href');
        this.injectNinjaScript(bottomSlot, footerNinjaUrl);
      } else {
        bottomSlot.href = secondaryOffer.url;
        bottomSlot.target = '_blank';
        bottomSlot.rel = 'noopener noreferrer';
        bottomSlot.innerHTML = `
          <span class="ad-pr-badge">スポンサーPR</span>
          <span class="ad-banner-text">${secondaryOffer.title}</span>
          <span class="ad-banner-cta">チェック &raquo;</span>
        `;
      }
      bottomSlot.addEventListener('click', () => {
        this.trackEvent('banner_click', { slot: 'footer', offer_id: secondaryOffer.offer_id });
      });
    }
  }

  evaluateRank(score) {
    const ranks = this.theme.ranks || [];
    let chosen = ranks[0] || { title: 'チャレンジャー', comment: 'ナイスプレイ！' };
    for (const r of ranks) {
      if (score >= r.min_score) chosen = r;
    }
    return chosen;
  }

  showResultModal(score, durationSec, onScoreBoosted) {
    this.currentScore = score;
    this.rewardClaimed = false;
    this.trackEvent('gameover', { score, duration_sec: durationSec });

    const rank = this.evaluateRank(score);
    const abCfg = (this.config.ab_testing && this.config.ab_testing.variants[this.variant]) || {
      badge_text: '【プレイヤー限定おすすめ情報】',
      button_style: 'urgent_red',
      reward_button_text: '🔥 PRをチェックしてスコア1.5倍ボーナス！'
    };

    const scoreEl = document.getElementById('resultScoreNum');
    const rankEl = document.getElementById('resultRankTitle');
    const commentEl = document.getElementById('resultRankComment');
    const rewardBtn = document.getElementById('btnRewardBoost');
    const affiliateBox = document.getElementById('resultAffiliateBox');
    const shareXBtn = document.getElementById('btnShareX');

    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (rankEl) rankEl.textContent = `称号：${rank.title}`;
    if (commentEl) commentEl.textContent = rank.comment;

    if (rewardBtn) {
      rewardBtn.style.display = 'block';
      rewardBtn.textContent = abCfg.reward_button_text;
      rewardBtn.onclick = () => {
        if (this.rewardClaimed) return;
        this.rewardClaimed = true;
        this.trackEvent('reward_ad_view', { score });
        if (window.gameAudio) window.gameAudio.playSE('reward');
        const boosted = Math.round(score * 1.5);
        this.currentScore = boosted;
        const newRank = this.evaluateRank(boosted);
        if (scoreEl) scoreEl.textContent = `${boosted.toLocaleString()} (1.5x UP!)`;
        if (rankEl) rankEl.textContent = `称号：${newRank.title} [PR特典解放]`;
        rewardBtn.textContent = '✅ 1.5倍スコアボーナス適用済み！下の限定特典もチェック↓';
        rewardBtn.style.opacity = '0.8';
        if (typeof onScoreBoosted === 'function') onScoreBoosted(boosted);
      };
    }

    if (affiliateBox) {
      const offersHtml = (this.theme.affiliate_offers || []).map(offer => `
        <div class="offer-card">
          <span class="offer-tag">${offer.tag || '注目PR'} / ${offer.network}</span>
          <div class="offer-title">${offer.title}</div>
          <div class="offer-desc">${offer.description}</div>
          <a href="${offer.url}" target="_blank" rel="noopener noreferrer"
             class="offer-cta-btn ${abCfg.button_style}"
             data-offer-id="${offer.offer_id}"
             data-cpa="${offer.cpa_jpy || 2000}">
             ${offer.cta_text} &raquo;
          </a>
        </div>
      `).join('');

      affiliateBox.innerHTML = `
        <div class="affiliate-header-badge ${abCfg.button_style}">${abCfg.badge_text} (AB:${this.variant})</div>
        ${offersHtml}
      `;

      affiliateBox.querySelectorAll('.offer-cta-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.trackEvent('affiliate_click', {
            offer_id: btn.getAttribute('data-offer-id'),
            cpa_jpy: Number(btn.getAttribute('data-cpa') || 2000)
          });
        });
      });
    }

    if (shareXBtn) {
      const shareText = encodeURIComponent(
        `【${this.theme.title}】でスコア ${score}点 獲得！\n称号「${rank.title}」を達成しました！\n#${this.theme.trend_keywords[0]} #時事ミニゲーム`
      );
      shareXBtn.href = `https://twitter.com/intent/tweet?text=${shareText}`;
      shareXBtn.onclick = () => this.trackEvent('share_click', { platform: 'x' });
    }

    const modal = document.getElementById('resultModal');
    if (modal) modal.classList.remove('hidden');
  }
}

window.MiniGameMonetizationSDK = MiniGameMonetizationSDK;
