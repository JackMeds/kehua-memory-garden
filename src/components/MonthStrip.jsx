export default function MonthStrip({ yearMonthIndex, currentYear, currentMonth, onNavigate }) {
  if (!currentYear || !yearMonthIndex[currentYear]) return null;

  const yearData = yearMonthIndex[currentYear];
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  return (
    <div className="month-strip">
      {yearData.months.map(m => (
        <button
          key={m}
          className={`month-btn${currentMonth === m ? ' active' : ''}`}
          onClick={() => {
            const idx = yearData.monthFirst?.[m];
            if (idx !== undefined) onNavigate(idx);
          }}
        >
          {monthNames[m - 1]}
        </button>
      ))}
    </div>
  );
}
