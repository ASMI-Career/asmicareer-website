'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/medical/news');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fffef5',
      fontFamily: 'sans-serif',
      color: '#1a0040'
    }}>
      <p>Redirecting to Medical News...</p>
    </div>
  );
}
