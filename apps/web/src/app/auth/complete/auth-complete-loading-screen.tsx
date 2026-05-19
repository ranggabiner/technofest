import type { ReactNode } from "react";

export function AuthCompleteLoadingScreen({ children }: { children?: ReactNode }) {
  return (
    <main className="auth-complete-shell" aria-busy="true">
      <style>{authCompleteCriticalCss}</style>
      <section className="auth-complete-card" role="status" aria-live="polite">
        <div className="auth-complete-mark" aria-hidden="true">
          <span className="auth-complete-spinner" />
        </div>
        <p className="auth-complete-eyebrow">MedProof</p>
        <h1 className="auth-complete-title">Menyiapkan dashboard</h1>
        <p className="auth-complete-copy">
          Sesi sudah valid. Tampilan aman sedang disiapkan.
        </p>
      </section>
      {children}
    </main>
  );
}

const authCompleteCriticalCss = `
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

  .auth-complete-shell {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 24px;
    background:
      radial-gradient(circle at 50% 0%, rgba(45, 212, 191, 0.12), transparent 34%),
      #fbfaf9;
  }

  .auth-complete-card {
    width: min(100%, 420px);
    box-sizing: border-box;
    border: 1px solid #f2f0ed;
    border-radius: 14px;
    background: #ffffff;
    padding: 32px 28px;
    text-align: center;
    box-shadow: inset 0 0 0 1px #f2f0ed, 0 16px 48px rgba(0, 0, 0, 0.05);
  }

  .auth-complete-mark {
    width: 56px;
    height: 56px;
    margin: 0 auto 20px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: #f0fdfa;
    color: #0d9488;
  }

  .auth-complete-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #ccfbf1;
    border-top-color: #0d9488;
    border-radius: 999px;
    animation: auth-complete-spin 780ms linear infinite;
  }

  .auth-complete-eyebrow {
    margin: 0 0 10px;
    color: #0d9488;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .auth-complete-title {
    margin: 0;
    color: #121212;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: 0;
  }

  .auth-complete-copy {
    margin: 14px auto 0;
    max-width: 320px;
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
    .auth-complete-shell {
      background: #171615;
      color: #ded8cf;
    }

    .auth-complete-shell {
      background:
        radial-gradient(circle at 50% 0%, rgba(94, 234, 212, 0.14), transparent 34%),
        #171615;
    }

    .auth-complete-card {
      border-color: #282624;
      background: #1d1b1a;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 16px 48px rgba(0, 0, 0, 0.35);
    }

    .auth-complete-mark {
      background: #0f2f2c;
      color: #5eead4;
    }

    .auth-complete-spinner {
      border-color: #134e4a;
      border-top-color: #5eead4;
    }

    .auth-complete-eyebrow {
      color: #5eead4;
    }

    .auth-complete-title {
      color: #fbfaf9;
    }

    .auth-complete-copy {
      color: #afa79e;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .auth-complete-spinner {
      animation: none;
    }
  }

  @keyframes auth-complete-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
