const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center p-12 relative overflow-hidden bg-base-200">

      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 blur-3xl animate-[pulse_6s_ease-in-out_infinite] -top-20 -left-20"></div>
      <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-secondary/40 to-secondary/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite] top-32 -right-24"></div>
      <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tl from-accent/30 to-accent/5 blur-3xl animate-[pulse_10s_ease-in-out_infinite] bottom-16 left-32"></div>

      <div className="relative max-w-md text-center">
        <h2 className="text-4xl font-extrabold mb-4 text-base-content drop-shadow-lg">
          {title}
        </h2>
        <p className="text-lg text-base-content/70">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;