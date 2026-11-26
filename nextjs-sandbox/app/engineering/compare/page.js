import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import CompareClient from './CompareClient';
import styles from '../colleges/compare.module.css';

export const metadata = {
  title: 'Compare engineering colleges | ASMI Career',
  robots: { index: false, follow: true },   // a personal selection, not a page to index
};

const links = [
  { label: 'Colleges', href: '/engineering/colleges' },
  { label: 'Counselling', href: '/engineering/counselling' },
  { label: 'Packages', href: '/engineering#packages' },
  { label: 'Services', href: '/engineering/services' },
  { label: 'Events', href: '/engineering/events' },
  { label: 'News', href: '/engineering/news' },
  { label: 'About Us', href: '/engineering/about' },
  { label: 'Contact Us', href: '/engineering/contact' },
];

export default function Page() {
  return (
    <div className={styles.page}>
      <Nav links={links} ctaHref="/engineering/inquiry" homeHref="/engineering" />
      <CompareClient />
      <Footer isEngineering />
    </div>
  );
}
