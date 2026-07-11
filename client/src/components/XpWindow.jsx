export default function XpWindow({ title, icon = "📘", children, wide = false }) {
  return (
    <div className={`xp-window ${wide ? "max-w-4xl" : "max-w-2xl"} w-full mx-auto relative z-20`}>
      <div className="xp-titlebar">
        <span className="flex items-center gap-2 text-[12px] tracking-widest drop-shadow-[1px_1px_0_#111]">
          <span className="text-sm drop-shadow-none">{icon}</span>
          {title}
        </span>
        <div className="window-controls">
          <span className="win-btn">_</span>
          <span className="win-btn">□</span>
          <span className="win-btn close">X</span>
        </div>
      </div>
      <div className="p-6 bg-[#fdfaf0]">{children}</div>
    </div>
  );
}
