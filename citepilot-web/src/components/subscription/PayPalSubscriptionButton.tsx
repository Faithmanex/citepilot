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
              create: (options: { plan_id: string; custom_id?: string }) => Promise<string>;
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

/**
 * Plan and client IDs are configuration, not code. When they are absent the
 * button says so instead of silently charging against a hardcoded plan.
 */
const CONFIGURED_PLAN_ID = (process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "").trim();
const CONFIGURED_CLIENT_ID = (process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "").trim();

interface PayPalSubscriptionButtonProps {
  planId?: string;
  clientId?: string;
  customId?: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: unknown) => void;
}

type Status =
  | "loading"
  | "ready"
  | "activating"
  | "active"
  | "error"
  | "unconfigured";

export default function PayPalSubscriptionButton({
  planId = CONFIGURED_PLAN_ID,
  clientId = CONFIGURED_CLIENT_ID,
  customId,
  onSuccess,
  onError,
}: PayPalSubscriptionButtonProps) {
  const containerId = `paypal-button-container-${planId || "unconfigured"}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const configured = Boolean(planId && clientId);
  const [status, setStatus] = useState<Status>(configured ? "loading" : "unconfigured");
  const [message, setMessage] = useState<string>("");
  const [subscribedId, setSubscribedId] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    let isMounted = true;
    const scriptId = "paypal-sdk-script";

    const renderPayPalButtons = () => {
      if (!isMounted) return;
      if (!window.paypal) {
        setMessage("PayPal could not be loaded. Check your connection and reload the page.");
        setStatus("error");
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
              const opts: { plan_id: string; custom_id?: string } = { plan_id: planId };
              if (customId) {
                opts.custom_id = customId;
              }
              return actions.subscription.create(opts);
            },
            onApprove: async function (data) {
              if (!isMounted) return;
              setStatus("activating");
              setMessage("Confirming your subscription with CitePilot…");

              // Activation is only real when the server confirms it. Showing
              // success on the strength of the PayPal callback alone would tell
              // a paying customer they have access when they might not.
              try {
                const res = await fetch("/api/subscription/activate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    subscriptionId: data.subscriptionID,
                    planId,
                  }),
                });
                const payload = (await res.json().catch(() => ({}))) as {
                  error?: string;
                };

                if (!res.ok) {
                  if (!isMounted) return;
                  setMessage(
                    payload.error ||
                      `Your payment was approved, but CitePilot could not activate the subscription (HTTP ${res.status}). Contact support with this subscription ID.`
                  );
                  setStatus("error");
                  if (onError) onError(new Error(payload.error || "Activation failed"));
                  return;
                }

                if (!isMounted) return;
                setSubscribedId(data.subscriptionID);
                setStatus("active");
                if (onSuccess) onSuccess(data.subscriptionID);
              } catch (err) {
                if (!isMounted) return;
                setMessage(
                  "Your payment was approved, but CitePilot could not be reached to activate the subscription. Reload the page to retry activation, or contact support."
                );
                setStatus("error");
                if (onError) onError(err);
              }
            },
            onError: function (err) {
              console.error("PayPal Subscription Error:", err);
              if (!isMounted) return;
              setMessage("PayPal reported a payment error. No charge was completed.");
              setStatus("error");
              if (onError) onError(err);
            },
          })
          .render(`#${containerId}`)
          .then(() => {
            if (isMounted && status === "loading") setStatus("ready");
          })
          .catch((err) => {
            console.error("PayPal Render Error:", err);
            if (!isMounted) return;
            setMessage("The PayPal button could not be displayed. Reload the page to try again.");
            setStatus("error");
          });
      } catch (err) {
        console.error("PayPal Initialization Error:", err);
        if (!isMounted) return;
        setMessage("The PayPal button could not be initialised. Reload the page to try again.");
        setStatus("error");
      }
    };

    if (window.paypal) {
      renderPayPalButtons();
      return () => {
        isMounted = false;
      };
    }

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement;

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription`;
      script.setAttribute("data-sdk-integration-source", "button-factory");
      script.async = true;

      script.onload = () => {
        renderPayPalButtons();
      };

      script.onerror = () => {
        if (!isMounted) return;
        setMessage("The PayPal SDK failed to load. Check your connection and reload the page.");
        setStatus("error");
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
    // `status` intentionally omitted: it only gates the first "ready" update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, planId, clientId, containerId, customId, onSuccess, onError]);

  if (status === "unconfigured") {
    return (
      <div
        role="status"
        className="w-full max-w-md my-4 rounded-xl border-2 border-[#d9cfb8] bg-[#f7f3e8] p-4 text-center text-sm text-[#5c5344]"
      >
        <p className="font-bold text-[#221d16] mb-1">Card and PayPal checkout is not configured</p>
        <p>
          This deployment has no PayPal plan configured, so no payment can be taken. Contact
          support to subscribe.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center my-4">
      {status === "active" && subscribedId ? (
        <div className="p-4 bg-[#dee8dd] border-2 border-[#285235] rounded-xl text-[#1d3a26] text-center w-full max-w-md">
          <div className="w-12 h-12 bg-[#285235] text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
            ✓
          </div>
          <h4 className="font-bold text-lg mb-1">Subscription verified</h4>
          <p className="text-sm opacity-90 mb-2">
            CitePilot confirmed this subscription with PayPal. Your subscription ID is:
          </p>
          <code className="bg-white px-3 py-1 rounded border border-[#a8c3ad] font-mono text-xs font-semibold block text-[#285235] break-all">
            {subscribedId}
          </code>
        </div>
      ) : (
        <div className="w-full max-w-md relative min-h-[120px] flex flex-col items-center justify-center">
          {(status === "loading" || status === "activating") && (
            <div
              role="status"
              className="flex items-center gap-2 text-[#5c5344] text-sm font-semibold py-6"
            >
              <span aria-hidden="true" className="inline-block animate-spin">◌</span>
              {status === "activating"
                ? "Confirming your subscription with CitePilot…"
                : "Loading PayPal subscription options…"}
            </div>
          )}

          {status === "error" && (
            <div
              role="alert"
              className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700 text-sm text-center w-full"
            >
              <p className="font-semibold mb-1">{message}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs underline text-red-800 font-bold hover:text-red-900 mt-2 cursor-pointer"
              >
                Reload page
              </button>
            </div>
          )}

          <div
            id={containerId}
            ref={containerRef}
            aria-busy={status === "loading"}
            className={`w-full transition-opacity duration-300 ${
              status === "ready" ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
            }`}
          />
        </div>
      )}
    </div>
  );
}
