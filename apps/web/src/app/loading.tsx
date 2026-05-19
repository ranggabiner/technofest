export default function Loading() {
  return (
    <main className="root-loading-shell" aria-busy="true">
      <style>{rootLoadingCriticalCss}</style>
      <section className="root-loading-card" role="status" aria-live="polite">
        <div className="root-loading-mark" aria-hidden="true">
          <span className="root-loading-spinner" />
        </div>
        <p className="root-loading-eyebrow">MedProof</p>
        <h1 className="root-loading-title">Menyiapkan halaman</h1>
        <p className="root-loading-copy">Tampilan sedang disiapkan.</p>
      </section>
    </main>
  );
}

const rootLoadingCriticalCss = `
  :root {
    color-scheme: light;
  }

  html,
  body {
    min-height: 100%;
    margin: 0;
    background: #fbfaf9;
    color: #474645;
    font-family: Inter, Arial, Helvetica, sans-serif;
  }

  .root-loading-shell {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 24px;
    background:
      radial-gradient(circle at 50% 0%, rgba(45, 212, 191, 0.12), transparent 34%),
      #fbfaf9;
  }

  .root-loading-card {
    width: min(100%, 400px);
    box-sizing: border-box;
    border: 1px solid #f2f0ed;
    border-radius: 14px;
    background: #ffffff;
    padding: 32px 28px;
    text-align: center;
    box-shadow: inset 0 0 0 1px #f2f0ed, 0 16px 48px rgba(0, 0, 0, 0.05);
  }

  .root-loading-mark {
    width: 56px;
    height: 56px;
    margin: 0 auto 20px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: #f0fdfa;
  }

  .root-loading-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #ccfbf1;
    border-top-color: #0d9488;
    border-radius: 999px;
    animation: root-loading-spin 780ms linear infinite;
  }

  .root-loading-eyebrow {
    margin: 0 0 10px;
    color: #0d9488;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .root-loading-title {
    margin: 0;
    color: #121212;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: 0;
  }

  .root-loading-copy {
    margin: 14px auto 0;
    color: #848281;
    font-size: 14px;
    line-height: 1.65;
    letter-spacing: 0;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
    }

    html,
    body,
    .root-loading-shell {
      background: #171615;
      color: #ded8cf;
    }

    .root-loading-shell {
      background:
        radial-gradient(circle at 50% 0%, rgba(94, 234, 212, 0.14), transparent 34%),
        #171615;
    }

    .root-loading-card {
      border-color: #282624;
      background: #1d1b1a;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 16px 48px rgba(0, 0, 0, 0.35);
    }

    .root-loading-mark {
      background: #0f2f2c;
    }

    .root-loading-spinner {
      border-color: #134e4a;
      border-top-color: #5eead4;
    }

    .root-loading-eyebrow {
      color: #5eead4;
    }

    .root-loading-title {
      color: #fbfaf9;
    }

    .root-loading-copy {
      color: #afa79e;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .root-loading-spinner {
      animation: none;
    }
  }

  @keyframes root-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
