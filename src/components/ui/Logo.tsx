interface LogoProps {
  className?: string;
}

export default function Logo({ className = 'flex items-center justify-center' }: LogoProps) {
  return (
    <div className={`${className} select-none`}>
      <img src="/1.png?v=2" alt="Katisha" className="h-7 w-auto object-contain sm:h-11 md:h-8 -mt-2" />
    </div>
  );
}
