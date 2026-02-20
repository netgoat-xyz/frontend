import OtpForm from "@/components/interface/auth/OtpForm";
import ShaderBackground from "@/components/interface/homescreen/shader-background";

export default function RegisterOtpPage() {
  return (
    <ShaderBackground>
      <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <OtpForm mode="register" />
        </div>
      </div>
    </ShaderBackground>
  );
}
