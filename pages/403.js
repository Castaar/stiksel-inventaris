import Head from "next/head";
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function Forbidden() {
  const router = useRouter();
  const { ip } = router.query;

  return (
    <>
      <Head>
        <title>Access Denied - Castaar Inventaris</title>
      </Head>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <Image
          src="/images/logo-castaar.svg"
          alt="Logo Castaar"
          width={230}
          height={34}
          style={{ marginBottom: '40px' }}
        />
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>403</h1>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Access Denied</h2>
        <p style={{ fontSize: '16px', color: '#666', maxWidth: '500px' }}>
          Your IP address is not authorized to access this application. 
          Please contact your administrator if you believe this is an error.
        </p>
        {ip && (
          <p style={{ fontSize: '14px', color: '#999', marginTop: '20px', fontFamily: 'monospace' }}>
            Detected IP: {ip}
          </p>
        )}
      </div>
    </>
  );
}
