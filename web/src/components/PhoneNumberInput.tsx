import type { InputHTMLAttributes } from "react";

type PhoneNumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> & {
  onChange: (value: string) => void;
};

export function PhoneNumberInput({ onChange, ...inputProps }: PhoneNumberInputProps) {
  return (
    <input
      {...inputProps}
      type="tel"
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}
