/**
 * TrendMiniGames Ad Monetization, A/B Testing & Telemetry SDK
 * - 忍者AdMax（全自動＋320x50バナー）＆ A8.net本番アフィリエイト（計測ピクセル付き）完全対応
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
    this.sendLiveTelemetry(eventType);
  }

  static hitCounter(key) {
    if (window.location.hostname !== 'studyhelperproject.github.io') return;
    fetch(`https://abacus.jasoncameron.dev/hit/trendminigames2026/${encodeURIComponent(key)}`, {
      method: 'GET',
      mode: 'cors',
      keepalive: true
    }).catch(() => {});
  }

  static trackSessionAttribution() {
    if (window.location.hostname !== 'studyhelperproject.github.io') return;
    MiniGameMonetizationSDK.hitCounter('site_pv');

    if (!localStorage.getItem('tmg_uu_counted')) {
      localStorage.setItem('tmg_uu_counted', '1');
      MiniGameMonetizationSDK.hitCounter('site_uu');
    }

    if (!sessionStorage.getItem('tmg_session_attr')) {
      sessionStorage.setItem('tmg_session_attr', '1');
      const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
      MiniGameMonetizationSDK.hitCounter(isMobile ? 'dev_mobile' : 'dev_pc');

      const params = new URLSearchParams(window.location.search);
      const utm = (params.get('utm_source') || '').toLowerCase();
      const ref = (document.referrer || '').toLowerCase();
      if (ref.includes('studyhelperproject.github.io') && !utm) {
        return; // サイト内回遊は外部流入経路として重複カウントしない
      }
      let refKey = 'ref_direct';
      if (utm === 'x' || utm === 'twitter' || ref.includes('t.co') || ref.includes('x.com') || ref.includes('twitter.com')) {
        refKey = 'ref_x';
      } else if (utm === 'google' || ref.includes('google.')) {
        refKey = 'ref_google';
      } else if (ref.includes('yahoo.co.jp') || ref.includes('bing.com') || ref.includes('duckduckgo.')) {
        refKey = 'ref_search_other';
      } else if (ref.includes('github.')) {
        refKey = 'ref_github';
      } else if (ref.length > 0) {
        refKey = 'ref_other';
      }
      MiniGameMonetizationSDK.hitCounter(refKey);
    }
  }

  sendLiveTelemetry(eventType) {
    const s = this.slug.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (eventType === 'impression') {
      MiniGameMonetizationSDK.trackSessionAttribution();
      MiniGameMonetizationSDK.hitCounter(`g_${s}_pv`);
    } else if (eventType === 'play_start') {
      MiniGameMonetizationSDK.hitCounter('total_plays');
      MiniGameMonetizationSDK.hitCounter(`g_${s}_play`);
    } else if (eventType === 'gameover') {
      MiniGameMonetizationSDK.hitCounter('total_ends');
      MiniGameMonetizationSDK.hitCounter(`g_${s}_end`);
    } else if (eventType === 'retry') {
      MiniGameMonetizationSDK.hitCounter('total_retries');
    } else if (eventType === 'banner_click' || eventType === 'affiliate_click') {
      MiniGameMonetizationSDK.hitCounter('total_aff_clicks');
      MiniGameMonetizationSDK.hitCounter(`g_${s}_aff`);
    } else if (eventType === 'share_click') {
      MiniGameMonetizationSDK.hitCounter('total_shares');
    } else if (eventType === 'reward_ad_view') {
      MiniGameMonetizationSDK.hitCounter('total_rewards');
    }
  }

  renderBannerSlots() {
    const primaryOffer = (this.theme.affiliate_offers && this.theme.affiliate_offers[0]) || {
      title: 'あなたの株式投資が一変するかもしれない情報源【旬の厳選10銘柄】',
      cta_text: '詳細を見る',
      url: 'https://px.a8.net/svt/ejp?a8mat=4BGJFR+4NATRM+ONS+TXW0I',
      pixel_url: 'https://www11.a8.net/0.gif?a8mat=4BGJFR+4NATRM+ONS+TXW0I'
    };
    const secondaryOffer = (this.theme.affiliate_offers && this.theme.affiliate_offers[1]) || primaryOffer;

    const topSlot = document.getElementById('topAdBanner');
    if (topSlot) {
      topSlot.href = primaryOffer.url;
      topSlot.rel = 'nofollow noopener noreferrer';
      topSlot.target = '_blank';
      const pixelHtml = primaryOffer.pixel_url
        ? `<img border="0" width="1" height="1" src="${primaryOffer.pixel_url}" alt="" style="position:absolute;width:1px;height:1px;opacity:0;" />`
        : '';
      topSlot.innerHTML = `
        <span class="ad-pr-badge">注目PR</span>
        <span class="ad-banner-text">${primaryOffer.title}</span>
        <span class="ad-banner-cta">公式へ &raquo;</span>
        ${pixelHtml}
      `;
      topSlot.addEventListener('click', () => {
        this.trackEvent('banner_click', { slot: 'header', offer_id: primaryOffer.offer_id });
      });
    }

    const bottomSlot = document.getElementById('bottomAdBanner');
    if (bottomSlot) {
      bottomSlot.href = secondaryOffer.url;
      bottomSlot.rel = 'nofollow noopener noreferrer';
      bottomSlot.target = '_blank';
      const pixelHtml2 = secondaryOffer.pixel_url
        ? `<img border="0" width="1" height="1" src="${secondaryOffer.pixel_url}" alt="" style="position:absolute;width:1px;height:1px;opacity:0;" />`
        : '';
      bottomSlot.innerHTML = `
        <span class="ad-pr-badge">おすすめPR</span>
        <span class="ad-banner-text">${secondaryOffer.title}</span>
        <span class="ad-banner-cta">チェック &raquo;</span>
        ${pixelHtml2}
      `;
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
      const offersHtml = (this.theme.affiliate_offers || []).map(offer => {
        const pixelImg = offer.pixel_url
          ? `<img border="0" width="1" height="1" src="${offer.pixel_url}" alt="" />`
          : '';
        return `
        <div class="offer-card">
          <span class="offer-tag">${offer.tag || '注目PR'} / ${offer.network}</span>
          <div class="offer-title">${offer.title}</div>
          <div class="offer-desc">${offer.description}</div>
          <a href="${offer.url}" target="_blank" rel="nofollow noopener noreferrer"
             class="offer-cta-btn ${abCfg.button_style}"
             data-offer-id="${offer.offer_id}"
             data-cpa="${offer.cpa_jpy || 2000}">
             ${offer.cta_text} &raquo;
          </a>
          ${pixelImg}
        </div>
      `;
      }).join('');

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
