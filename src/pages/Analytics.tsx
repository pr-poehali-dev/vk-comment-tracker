import Icon from '@/components/ui/icon';

export default function Analytics() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Аналитика</span>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Статистика упоминаний</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Последние 7 дней</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Всего упоминаний', value: '—', icon: 'BarChart2', color: 'text-muted-foreground' },
          { label: 'Совпадений', value: '—', icon: 'TrendingUp', color: 'text-muted-foreground' },
          { label: 'Негативных', value: '—', icon: 'TrendingDown', color: 'text-muted-foreground' },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              <Icon name={s.icon as any} size={14} className={`${s.color} shrink-0`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold font-mono text-muted-foreground">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          Активность по дням
        </h2>
        <div className="flex items-end gap-3 h-36">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-muted rounded h-full opacity-30" />
              <span className="text-xs font-mono text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-5 mt-5 pt-5 border-t border-border">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /><span className="text-xs text-muted-foreground">Позитив</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" /><span className="text-xs text-muted-foreground">Нейтрально</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /><span className="text-xs text-muted-foreground">Негатив</span></div>
        </div>
      </div>

      {/* Empty state */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Рейтинг групп</h2>
        </div>
        <div className="px-6 py-12 flex flex-col items-center text-center gap-3">
          <Icon name="BarChart2" size={32} className="text-muted-foreground" />
          <p className="text-sm font-medium">Нет данных</p>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Статистика появится после подключения VK API и первого сбора комментариев
          </p>
        </div>
      </div>
    </div>
  );
}
