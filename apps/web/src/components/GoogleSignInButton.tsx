import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleSignInButtonProps = {
  onCredential: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
  text?: "continue_with" | "signin_with" | "signup_with";
};

declare global {
  interface Window {
    google?: any;
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export default function GoogleSignInButton({
  onCredential,
  onError,
  text = "continue_with"
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log("VITE_GOOGLE_CLIENT_ID:", clientId);


    if (!clientId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function setup() {
      try {
        await loadGoogleScript();

        if (cancelled || !window.google?.accounts?.id || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: GoogleCredentialResponse) => {
            if (!response.credential) {
              onError("Google did not return a credential");
              return;
            }

            try {
              await onCredential(response.credential);
            } catch (error) {
              onError(error instanceof Error ? error.message : "Google sign-in failed");
            }
          }
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "pill",
          width: 320
        });
      } catch (error) {
        if (!cancelled) {
          onError(error instanceof Error ? error.message : "Failed to load Google sign-in");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void setup();

    return () => {
      cancelled = true;
    };
  }, [onCredential, onError, text]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return (
      <p className="auth-support-copy">
        Google sign-in is unavailable until VITE_GOOGLE_CLIENT_ID is configured.
      </p>
    );
  }

  return (
    <div>
      {loading ? <p className="auth-support-copy">Loading Google sign-in...</p> : null}
      <div ref={containerRef} />
    </div>
  );
}
