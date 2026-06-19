import logo from "@/assets/vyrol-logo.asset.json";

export function Logo({ className = "h-8" }: { className?: string }) {
  return <img src={logo.url} alt="VYROL" className={className} />;
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <div
      className="gradient-brand grid place-items-center rounded-lg font-display font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      V
    </div>
  );
}
