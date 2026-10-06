import type { InputHTMLAttributes } from "react";
import { getCountryCallingCode } from "libphonenumber-js";
import { DEVICE_PHONE_COUNTRY } from "../utils/phone";
import "../styles/PhoneNumberInput.css";

type PhoneNumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> & {
  onChange: (value: string) => void;
};

export function PhoneNumberInput({ onChange, ...inputProps }: PhoneNumberInputProps) {
  const callingCode = getCountryCallingCode(DEVICE_PHONE_COUNTRY);

  return (
    <div className="phone-number-field">
      <span
        className="phone-country-prefix"
        aria-label={`Country calling code +${callingCode}, inferred from your device region`}
        title={`Country calling code inferred from your device region`}
      >
        +{callingCode}
      </span>
      <input
        {...inputProps}
        type="tel"
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}
