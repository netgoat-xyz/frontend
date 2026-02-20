import MagicLinkForm from "@/components/interface/auth/MagicLinkForm";
import ShaderBackground from "@/components/interface/homescreen/shader-background";

export default function LoginMagicLinkPage() {
  return (
    <ShaderBackground>
      <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <MagicLinkForm mode="login" />
        </div>
      </div>
    </ShaderBackground>
  );
}
