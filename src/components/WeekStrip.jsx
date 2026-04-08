import { useMemo } from 'react';

export default function WeekStrip({ year, month, day }) {
  const weekDays = useMemo(() => {
    if (!year || !month || !day) return null;

    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    const labels = ['一', '二', '三', '四', '五', '六', '日'];
    const days = [];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      days.push({
        label: labels[i],
        date: cur.getDate(),
        isActive: cur.getDate() === day && cur.getMonth() === d.getMonth(),
      });
    }
    return days;
  }, [year, month, day]);

  if (!weekDays) return null;

  return (
    <div className="week-strip">
      {weekDays.map((wd, i) => (
        <div key={i} className={`week-day${wd.isActive ? ' active' : ''}`}>
          <span className="wd-label">{wd.label}</span>
          <span className="wd-date">{wd.date}</span>
        </div>
      ))}
    </div>
  );
}
