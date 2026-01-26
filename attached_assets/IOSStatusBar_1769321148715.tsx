export function IOSStatusBar() {
  return (
    <div className="h-11 flex items-center justify-between px-6 pt-2">
      <span className="text-[15px] font-semibold">9:41</span>
      <div className="flex items-center gap-1.5">
        {/* Signal */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" className="opacity-90">
          <rect x="0" y="7" width="3" height="5" rx="1" fill="currentColor"/>
          <rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor"/>
          <rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/>
          <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/>
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="opacity-90">
          <path d="M8 12C8.69036 12 9.25 11.4404 9.25 10.75C9.25 10.0596 8.69036 9.5 8 9.5C7.30964 9.5 6.75 10.0596 6.75 10.75C6.75 11.4404 7.30964 12 8 12Z" fill="currentColor"/>
          <path d="M4.5 7.5C5.5 8.5 6.5 9 8 9C9.5 9 10.5 8.5 11.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M2 5C4 7 5.5 7.5 8 7.5C10.5 7.5 12 7 14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" className="opacity-90">
          <rect x="0.5" y="1.5" width="21" height="9" rx="2.5" stroke="currentColor" strokeWidth="1"/>
          <rect x="2" y="3" width="18" height="6" rx="1" fill="currentColor"/>
          <path d="M23 4V8C23.5 7.8 24 7.5 24 6C24 4.5 23.5 4.2 23 4Z" fill="currentColor"/>
        </svg>
      </div>
    </div>
  );
}
