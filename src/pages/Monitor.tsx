import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';

const API = 'https://functions.poehali.dev/1ba8f77d-759f-4bd4-bfc3-bd43b661451d';

interface Comment {
  id: number;
  group_id: number;
  group_name: string;
  vk_post_id: number;
  vk_comment_id: number;
  author_id: number;
  author_name: string;
  author_photo: string | null;
  text: string;
  published_at: string | null;
  fetched_at: string | null;
  sentiment: string;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}с назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)}м назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ч назад`;
  return `${Math.floor(diff / 86400)}д назад`;
}

export default function Monitor() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}?limit=100`);
      const text = await res.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) setComments(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = comments.filter(c =>
    !search || c.text.toLowerCase().includes(search.toLowerCase()) || c.author_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot inline-block" />
            <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Мониторинг</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Лента комментариев</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? 'Загрузка...' : `${comments.length} комментариев`}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors shrink-0"
        >
          <Icon name="RefreshCw" size={14} />
          Обновить
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск по тексту или автору..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:border-foreground/40 transition-colors font-sans"
        />
      </div>

      {/* Feed */}
      {loading ? (
        <div className="bg-card border border-border rounded-lg px-6 py-16 flex flex-col items-center gap-3">
          <Icon name="Loader" size={24} className="text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg px-6 py-16 flex flex-col items-center text-center gap-3">
          <Icon name="Activity" size={32} className="text-muted-foreground" />
          <p className="text-sm font-medium">{search ? 'Ничего не найдено' : 'Лента пуста'}</p>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            {search ? 'Попробуй другой запрос' : 'Нажми «Начать мониторинг» в разделе Группы — комментарии появятся здесь'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors">
              <div className="flex items-start gap-3">
                {c.author_photo ? (
                  <img src={c.author_photo} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon name="User" size={14} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <a
                      href={`https://vk.com/id${c.author_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline"
                    >
                      {c.author_name}
                    </a>
                    <span className="text-xs text-muted-foreground">в</span>
                    <span className="text-xs font-medium text-primary">{c.group_name}</span>
                    <span className="ml-auto text-xs text-muted-foreground font-mono shrink-0">
                      {timeAgo(c.published_at || c.fetched_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed break-words">{c.text}</p>
                  <a
                    href={`https://vk.com/wall-${c.group_id}_${c.vk_post_id}?reply=${c.vk_comment_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1.5 transition-colors"
                  >
                    <Icon name="ExternalLink" size={11} />
                    Открыть в ВК
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
