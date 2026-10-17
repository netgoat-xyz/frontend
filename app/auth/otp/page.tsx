import { redirect } from "next/navigation";

/** Legacy alias: the generic OTP route maps to the sign-in flow. */
export default function OtpAliasPage() {
  redirect("/auth/login/otp");
}
