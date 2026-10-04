export default function Navbar() {
  return (
    <header className="site-nav">
      <a className="nav-brand" href="#top" aria-label="Bugatti Chiron — back to top">
        <span className="brand-oval"><b>B</b></span>
        <span className="brand-wordmark">BUGATTI</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="#anatomy">The Chiron</a>
        <a href="#performance">Performance</a>
        <a href="#craft">Craftsmanship</a>
      </nav>
      <a className="nav-reserve" href="https://www.bugatti.com/en/models/chiron" target="_blank" rel="noreferrer">Reserve <span aria-hidden="true">↗</span></a>
    </header>
  );
}
