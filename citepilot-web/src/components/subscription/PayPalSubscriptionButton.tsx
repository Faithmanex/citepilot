"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: {
          shape?: string;
          color?: string;
          layout?: string;
          label?: string;
          height?: number;
        };
        createSubscription: (
          data: Record<string, unknown>,
          actions: {
            subscription: {
              create: (options: { plan_id: string }) => Promise<string>;
            };
          }
        ) => Promise<string>;
        onApprove: (
          data: { subscriptionID: string },
          actions: Record<string, unknown>
        ) => void | Promise<void>;
        onError?: (err: unknown) => void;
        onCancel?: (data: unknown) => void;
      }) => {
        render: (containerSelectorOrElement: string | HTMLElement) => Promise<void>;
      };
    };
  }
}

interface PayPalSubscriptionButtonProps {
  planId?: string;
  clientId?: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: unknown) => void;
}

const DEFAULT_PLAN_ID = "P-00697875B1151583ANJV3VOY";
const DEFAULT_CLIENT_ID =
  "AQk7S24Sc2iKHeIuA93BP-3MN3fPOumFejN4lxJmku14oGkjT_T7l8lYgaS9ohmMf8YZl4M1aHLLS_H3";

export default function PayPalSubscriptionButton({
  planId = DEFAULT_PLAN_ID,
  clientId = DEFAULT_CLIENT_ID,
  onSuccess,
  onError,
}: PayPalSubscriptionButtonProps) {
  const containerId = `paypal-button-container-${planId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [subscribedId, setSubscribedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const scriptId = "paypal-sdk-script";

    const renderPayPalButtons = () => {
      if (!isMounted) return;
      if (!window.paypal) {
        setScriptError("PayPal SDK failed to load.");
        setLoading(false);
        return;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      try {
        window.paypal
          .Buttons({
            style: {
              shape: "pill",
              color: "blue",
              layout: "vertical",
              label: "subscribe",
            },
            createSubscription: function (_data, actions) {
              return actions.subscription.create({
                plan_id: planId,
              });
            },
            onApprove: function (data) {
              if (isMounted) {
                setSubscribedId(data.subscriptionID);
              }
              if (onSuccess) {
                onSuccess(data.subscriptionID);
              } else {
                alert(`Subscription successful! ID: ${data.subscriptionID}`);
              }
            },
            onError: function (err) {
              console.error("PayPal Subscription Error:", err);
              if (isMounted) {
                setScriptError("Payment processing error occurred. Please try again.");
              }
              if (onError) onError(err);
            },
          })
          .render(`#${containerId}`)
          .then(() => {
            if (isMounted) setLoading(false);
          })
          .catch((err) => {
            console.error("PayPal Render Error:", err);
            if (isMounted) {
              setScriptError("Could not render PayPal button.");
              setLoading(false);
            }
          });
      } catch (err) {
        console.error("PayPal Initialization Error:", err);
        if (isMounted) {
          setScriptError("Initialization failed.");
          setLoading(false);
        }
      }
    };

    if (window.paypal) {
      renderPayPalButtons();
      return () => {
        isMounted = false;
      };
    }

    let existingScript = document.getElementById(scriptId) as HTMLScriptElement;

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
      script.setAttribute("data-sdk-integration-source", "button-factory");
      script.async = true;

      script.onload = () => {
        renderPayPalButtons();
      };

      script.onerror = () => {
        if (isMounted) {
          setScriptError("Failed to load PayPal SDK script.");
          setLoading(false);
        }
      };

      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", renderPayPalButtons);
    }

    return () => {
      isMounted = false;
      if (existingScript) {
        existingScript.removeEventListener("load", renderPayPalButtons);
      }
    };
  }, [planId, clientId, containerId, onSuccess, onError]);

  return (
    <div className="w-full flex flex-col items-center justify-center my-4">
      {subscribedId ? (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-emerald-900 text-center w-full max-w-md animate-fade-in">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
            ✓
          </div>
          <h4 className="font-bold text-lg mb-1">Subscription Active!</h4>
          <p className="text-sm opacity-90 mb-2">
            Thank you for subscribing to CitePilot. Your subscription ID is:
          </p>
          <code className="bg-white px-3 py-1 rounded border border-emerald-300 font-mono text-xs font-semibold block text-emerald-800 break-all">
            {subscribedId}
          </code>
        </div>
      ) : (
        <div className="w-full max-w-md relative min-h-[120px] flex flex-col items-center justify-center">
          {loading && (
            <div className="flex items-center gap-2 text-ink-soft text-sm font-semibold py-6">
              <i className="fas fa-circle-notch fa-spin text-brand text-lg" aria-hidden="true" />
              Loading PayPal Subscription options...
            </div>
          )}

          {scriptError && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700 text-sm text-center w-full">
              <p className="font-semibold mb-1">{scriptError}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs underline text-red-800 font-bold hover:text-red-900 mt-2"
              >
                Reload Page
              </button>
            </div>
          )}

          <div
            id={containerId}
            ref={containerRef}
            className={`w-full transition-opacity duration-300 ${
              loading ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
            }`}
          />
        </div>
      )}
    </div>
  );
}
