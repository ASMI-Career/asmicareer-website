import colleges from '../../../../public/data/colleges.json';
import CollegeDetailClient from './CollegeDetailClient';
import Nav from '../../../components/Nav';
import Footer from '../../../components/Footer';

export async function generateStaticParams() {
  return colleges.map((c) => ({
    slug: c.slug,
  }));
}

export default async function Page({ params }) {
  const { slug } = await params;
  const college = colleges.find((c) => c.slug === slug) || null;
  return (
    <>
      <Nav />
      <CollegeDetailClient college={college} slug={slug} />
      <Footer />
    </>
  );
}
