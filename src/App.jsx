import { useState } from 'react'
import SiteNav from './components/SiteNav.jsx'
import Hero from './components/Hero.jsx'
import AnnouncementFeed from './components/AnnouncementFeed.jsx'
import Icon from './components/Icon.jsx'
import { useMotionPreference } from './hooks/useMotionPreference.js'
import { useAnnouncements } from './hooks/useAnnouncements.js'

export default function App() {
  const motion = useMotionPreference()
  const data = useAnnouncements()
  const [category, setCategory] = useState('all')
  const [source, setSource] = useState('all')
  const [query, setQuery] = useState('')
  const featured = data.announcements.find((item) => item.featured) ?? data.announcements[0]
  function explore(nextCategory = 'all', nextSource = 'all') {
    setCategory(nextCategory)
    setSource(nextSource)
    setQuery('')
  }
  return (
    <>
      <a className="skip-link" href="#main">跳到主要內容</a>
      <SiteNav motion={motion} onExplore={explore} />
      <main id="main" tabIndex={-1}>
        <Hero featured={featured} count={data.announcements.length} onExplore={explore} />
        <AnnouncementFeed data={data} category={category} source={source} query={query}
          onCategoryChange={setCategory} onSourceChange={setSource} onQueryChange={setQuery} onReset={() => explore()} />
      </main>
      <footer className="site-footer page-width" id="sources">
        <div className="footer-brand"><span className="brand-name"><Icon name="target" />活動獵人</span><p>消息幫你整理，機會留給自己。</p></div>
        <div className="source-note">
          <p className="source-heading">情報從哪裡來？</p>
          <div className="source-links">{data.sources.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer">{item.label}<Icon name="arrow-up-right" /><span className="sr-only">（另開分頁）</span></a>)}</div>
          <p className="source-disclosure">每日 00:00 整理校方消息。資格、期限與獎項以原公告為準。</p>
          <p className="source-disclosure">學生視角的原創概念網站，非校方官方網站。</p>
        </div>
      </footer>
    </>
  )
}
