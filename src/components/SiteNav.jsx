import Icon from './Icon.jsx'
export default function SiteNav({ motion, onExplore }) {
  const { motionEnabled, toggleMotion, systemReduced } = motion
  return (
    <header className="site-nav"><div className="nav-inner page-width">
      <a className="brand" href="#main" aria-label="活動獵人，回到首頁"><span className="brand-mark"><Icon name="target" /></span><span className="brand-name">活動獵人<span className="brand-edition">澎科大情報站</span></span></a>
      <nav className="nav-links" aria-label="主要導覽">
        <a href="#announcements" onClick={() => onExplore()}>全部消息</a>
        <a href="#announcements" onClick={() => onExplore('rewards')}><span className="nav-dot" />好康優先</a>
        <a href="#announcements" onClick={() => onExplore('all', 'library')}>圖書館情報</a>
      </nav>
      <button className="motion-toggle" type="button" role="switch" aria-label="裝飾動效" aria-checked={motionEnabled} onClick={toggleMotion} disabled={systemReduced} title={systemReduced ? '依照系統設定減少動效' : motionEnabled ? '立即暫停所有裝飾動效' : '開啟裝飾動效'}>
        <Icon name={motionEnabled ? 'pause' : 'play'} /><span>{systemReduced ? '系統減少動效' : motionEnabled ? '暫停動效' : '開啟動效'}</span>
      </button>
    </div></header>
  )
}
