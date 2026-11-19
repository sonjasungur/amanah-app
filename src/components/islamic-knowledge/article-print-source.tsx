/** Only on paper: where the printed text comes from and how current it is. */
export function ArticlePrintSource({ url, status }: { url: string; status?: string }) {
  return (
    <p className="print-only mt-8 border-t pt-2 text-xs" data-testid="article-print-source">
      Quelle: <span className="break-all">{url}</span>
      {status && ` · ${status}`} · Die Online-Fassung kann neuer sein.
    </p>
  );
}
