"use client";

// Sprint 10D: VIN risk-check beta preview modal. Format check only — NO
// provider call, NO persistence, NO API request. The VIN value lives in
// component state for the lifetime of the open modal and is dropped on close.
// Real provider wiring, VinCheckRequest persistence, and quota enforcement are
// deferred to Sprint 11 (see docs/sprint-9a/VIN_CHECK_ARCHITECTURE_ADDENDUM.md).

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { isValidVin, normalizeVin } from "@/lib/vin-check/validation";

type Props = {
  open: boolean;
  onClose: () => void;
};

type CheckState =
  | { kind: "idle" }
  | { kind: "valid"; vin: string }
  | { kind: "invalid"; reason: string };

const DISCLAIMER =
  "Bu beta yoxlama ilkin risk siqnalıdır və ekspert yoxlamasını əvəz etmir.";

const INVALID_REASON =
  "VIN 17 simvol olmalıdır; I, O, Q hərfləri istifadə edilmir.";

export function VinCheckBetaModal({ open, onClose }: Props) {
  const [input, setInput] = useState("");
  const [check, setCheck] = useState<CheckState>({ kind: "idle" });

  function handleClose() {
    setInput("");
    setCheck({ kind: "idle" });
    onClose();
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const vin = normalizeVin(input);
    if (isValidVin(vin)) {
      setCheck({ kind: "valid", vin });
    } else {
      setCheck({ kind: "invalid", reason: INVALID_REASON });
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="VIN üzrə risk yoxlaması"
      eyebrow="Beta"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-foreground-muted">
          Avtomobili almadan əvvəl VIN kodunu yoxla. {DISCLAIMER}
        </p>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
            VIN kodu
          </span>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={17}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (check.kind !== "idle") setCheck({ kind: "idle" });
            }}
            placeholder="17 simvollu VIN"
            className="block h-11 w-full rounded-[var(--radius)] border border-border bg-surface px-3 font-mono text-sm uppercase tracking-wider text-foreground outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20"
            aria-invalid={check.kind === "invalid"}
            aria-describedby="vin-beta-status"
          />
        </label>

        <div id="vin-beta-status" aria-live="polite" className="min-h-[2.5rem]">
          {check.kind === "valid" ? (
            <div className="rounded-[var(--radius)] border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              <p className="font-semibold">✓ Format etibarlıdır</p>
              <p className="mt-1 text-xs text-foreground-muted">{DISCLAIMER}</p>
            </div>
          ) : null}

          {check.kind === "invalid" ? (
            <div className="rounded-[var(--radius)] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {check.reason}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Bağla
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={input.trim().length === 0}
          >
            VIN yoxla
          </Button>
        </div>
      </form>
    </Modal>
  );
}
