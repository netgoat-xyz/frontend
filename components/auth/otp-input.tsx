"use client";

import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from "@/components/ui/otp-field";

/**
 * Six-slot one-time-code input with a 3+3 separator, shared by the OTP,
 * forgot-password and email-verification flows.
 */
export function OtpInput({
  value,
  onValueChange,
  disabled,
  "aria-label": ariaLabel,
  autoFocus,
}: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
  autoFocus?: boolean;
}) {
  return (
    <OTPField
      aria-label={ariaLabel ?? "One-time code"}
      length={6}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      size="lg"
    >
      <OTPFieldInput autoFocus={autoFocus} />
      <OTPFieldInput aria-label="Character 2 of 6" />
      <OTPFieldInput aria-label="Character 3 of 6" />
      <OTPFieldSeparator />
      <OTPFieldInput aria-label="Character 4 of 6" />
      <OTPFieldInput aria-label="Character 5 of 6" />
      <OTPFieldInput aria-label="Character 6 of 6" />
    </OTPField>
  );
}
