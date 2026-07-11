export default function XpWindow({ title, icon = "📘", children, wide = false }) {
  return (
    <div className={`xp-window ${wide ? "max-w-3xl" : "max-w-xl"} w-full`}>
      <div className="xp-titlebar">
        <span className="flex items-center gap-2 text-sm">
          <span>{icon}</span>
          {title}
        </span>
        <div className="flex gap-1">
          <span className="w-5 h-5 flex items-center justify-center bg-xpface text-xpblue-dark border border-white/50 rounded-sm text-xs font-bold">
            _
          </span>
          <span className="w-5 h-5 flex items-center justify-center bg-xpface text-xpblue-dark border border-white/50 rounded-sm text-xs font-bold">
            &#9633;
          </span>
          <span className="w-5 h-5 flex items-center justify-center bg-red-600 text-white border border-white/50 rounded-sm text-xs font-bold">
            &#10005;
          </span>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
