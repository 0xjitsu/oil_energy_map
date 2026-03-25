function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#060a10',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'monospace',
          fontSize: '48px',
          color: 'rgba(255,255,255,0.25)',
          marginBottom: '8px'
        }}>
          {statusCode || 'Error'}
        </h1>
        <p style={{
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.5)'
        }}>
          {statusCode === 404 ? 'Page not found' : 'An error occurred'}
        </p>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: { res?: { statusCode: number }; err?: { statusCode: number } }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
