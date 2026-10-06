import Icon from './Icon.jsx'
export default function Hero({ featured, count, onExplore }) {
  return (
    <section className="hero page-width" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span className="status-dot" />你的校園情報，已經集合。</p>
        <h1 id="hero-title"><span>禮券甚麼好康的</span><span className="hero-emphasis">都給我來。</span></h1>
        <p className="hero-description">校網公告、圖書館活動，幫你整理在一起。<br className="desktop-break" />找獎勵、聽講座、看機會，課表以外也有好事。</p>
        <div className="hero-actions"><a className="button-primary" href="#announcements" onClick={() => onExplore('rewards')}>幫我找好康<Icon name="arrow-up-right" /></a><a className="button-text" href="#announcements" onClick={() => onExplore()}>看看全部消息<Icon name="arrow-down" /></a></div>
        <div className="hero-proof"><div className="source-emblems" aria-hidden="true"><span><Icon name="target" /></span><span><Icon name="book" /></span></div><p><strong>校網 × 圖書館</strong><span>兩個消息來源，一個情報入口。</span></p></div>
      </div>
      <div className="hero-visual" aria-label="活動獵人的好康情報票券">
        <div className="visual-grid" aria-hidden="true" /><div className="radar-orbit orbit-one" aria-hidden="true" /><div className="radar-orbit orbit-two" aria-hidden="true" />
        <div className="orbit-marker ambient-motion" aria-hidden="true"><span /></div>
        <span className="visual-coordinate coordinate-top" aria-hidden="true">情報座標 · 01</span><span className="visual-coordinate coordinate-bottom" aria-hidden="true">把值得的事，圈進生活裡。</span>
        <div className="ticket-back" aria-hidden="true"><Icon name="target" /></div>
        <div className="ticket-float ambient-motion"><div className="hunter-ticket">
          <div className="ticket-topline"><span><Icon name="target" />活動獵人</span><span>精選情報 001</span></div>
          <div className="ticket-headline"><span>好康，<br />別放過。</span><Icon name="spark" /></div>
          <div className="ticket-feature"><span className="ticket-label">本期線索</span><p>{featured.title}</p><span className="ticket-benefit">{featured.benefit ?? '活動內容與資格，查看原公告'}</span></div>
          <div className="ticket-perforation" aria-hidden="true" />
          <a className="ticket-bottom" href={featured.url} target="_blank" rel="noopener noreferrer"><span><span className="ticket-bottom-label">這張情報，值得看看</span><strong>前往原公告<Icon name="arrow-up-right" /></strong></span><span className="ticket-barcode" aria-hidden="true" /><span className="sr-only">：{featured.title}（另開分頁）</span></a>
        </div></div>
        <span className="visual-stamp" aria-hidden="true"><Icon name="gift" /><span>把好康<br />放進雷達</span></span>
      </div>
      <div className="hero-bottomline"><p><span className="section-number">01 —</span>課表之外，也有值得出發的事。</p><a href="#announcements" onClick={() => onExplore()}><span>{String(count).padStart(2, '0')} 則校園情報</span><Icon name="arrow-down" /></a></div>
    </section>
  )
}
