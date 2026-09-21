"use client";

import { useState } from "react";
import { MAX_QUANTITY, money, quote, TIERS, tierNote } from "@/lib/pricing";

const PRESETS = [
  { qty: 1, label: "Just one" },
  { qty: 5, label: "Trip · 5" },
  { qty: 12, label: "Birthday · 12" },
  { qty: 25, label: "Wedding · 25" },
  { qty: 60, label: "Big wedding · 60" },
];

const PAYMENTS = [
  { id: "card", name: "Card", meta: "Visa · Mastercard" },
  { id: "cod", name: "Cash on delivery", meta: "Pay the courier" },
  { id: "whish", name: "Whish Money", meta: "Transfer on confirmation" },
];

export function PackCalculator() {
  const [quantity, setQuantity] = useState(25);
  const [payment, setPayment] = useState("card");
  const priced = quote(quantity);

  return (
    <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div>
        <span className="sw-label">Common orders</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.qty}
              type="button"
              className="sw-chip"
              aria-pressed={priced.quantity === preset.qty}
              onClick={() => setQuantity(preset.qty)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-label="Fewer cameras"
            className="h-10 w-10 flex-none rounded-[10px] border border-[var(--line)] bg-[var(--paper)] text-lg font-bold"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <input
            inputMode="numeric"
            aria-label="Number of cameras"
            value={quantity}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              setQuantity(Number.isNaN(next) ? 1 : Math.min(MAX_QUANTITY, Math.max(1, next)));
            }}
            className="w-[86px] rounded-[10px] border border-[var(--line)] bg-[var(--paper)] p-2 text-center font-mono text-lg"
          />
          <button
            type="button"
            aria-label="More cameras"
            className="h-10 w-10 flex-none rounded-[10px] border border-[var(--line)] bg-[var(--paper)] text-lg font-bold"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
          >
            +
          </button>
          <span className="text-sm text-[var(--ink-2)]">{tierNote(priced.tier)}</span>
        </div>

        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="pb-2 text-left font-mono text-[11px] font-normal uppercase tracking-widest text-[var(--ink-3)]">
                Cameras
              </th>
              <th className="pb-2 text-right font-mono text-[11px] font-normal uppercase tracking-widest text-[var(--ink-3)]">
                Per camera
              </th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((tier) => {
              const active = tier.min === priced.tier.min;
              return (
                <tr key={tier.min} style={{ color: active ? "var(--magenta)" : undefined }}>
                  <td
                    className="border-t border-[var(--line)] py-2 tabular-nums"
                    style={{ fontWeight: active ? 700 : 400 }}
                  >
                    {tier.label}
                  </td>
                  <td
                    className="border-t border-[var(--line)] py-2 text-right tabular-nums"
                    style={{ fontWeight: active ? 700 : 400 }}
                  >
                    ${tier.price}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sw-panel p-5" id="order">
        <h3 className="mb-1.5 text-lg">Order summary</h3>
        <p className="mb-2.5 text-[13px] text-[var(--ink-3)]">
          Checkout is not live yet — card, cash on delivery and Whish Money are being wired up.
        </p>

        <div className="flex justify-between gap-3 py-2 text-sm tabular-nums">
          <span>{priced.quantity} × Custom wrap camera</span>
          <span>{money(priced.subtotal)}</span>
        </div>
        <div className="flex justify-between gap-3 border-t border-[var(--line)] py-2 text-sm">
          <span>Design &amp; proofing</span>
          <span style={{ color: "var(--ok)" }}>Included</span>
        </div>
        <div className="flex justify-between gap-3 border-t border-[var(--line)] py-2 text-sm tabular-nums">
          <span>
            {priced.shipping === 0 ? "Delivery · Lebanon (free over $150)" : "Delivery · Lebanon"}
          </span>
          <span>{priced.shipping === 0 ? "Free" : money(priced.shipping)}</span>
        </div>
        <div className="mt-1 flex justify-between gap-3 border-t-2 border-[var(--ink)] pt-3 font-display text-lg font-extrabold tabular-nums">
          <span>Total</span>
          <span>{money(priced.total)}</span>
        </div>

        <span className="sw-label mt-4 flex items-center gap-1.5">
          Payment
          <span className="rounded bg-[var(--cyan-soft)] px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-[var(--cyan)]">
            NOT LIVE
          </span>
        </span>
        <div className="mt-2 flex flex-col gap-2">
          {PAYMENTS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={payment === option.id}
              onClick={() => setPayment(option.id)}
              className="flex w-full items-center gap-3 rounded-[10px] border p-3 text-left"
              style={{
                borderColor: payment === option.id ? "var(--magenta)" : "var(--line)",
                background: payment === option.id ? "var(--magenta-soft)" : "var(--paper)",
              }}
            >
              <span>
                <span className="block text-sm font-bold">{option.name}</span>
                <span className="block font-mono text-xs text-[var(--ink-3)]">{option.meta}</span>
              </span>
              <span
                className="ml-auto h-[18px] w-[18px] flex-none rounded-full border"
                style={{
                  borderColor: payment === option.id ? "var(--magenta)" : "var(--line)",
                  background: payment === option.id ? "var(--magenta)" : "transparent",
                  boxShadow: payment === option.id ? "inset 0 0 0 3px var(--surface)" : undefined,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
