export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050814] px-6 text-slate-100">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent-cyan">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Route yang Anda tuju tidak tersedia di workspace ini. Kembali ke dashboard utama untuk melanjutkan pekerjaan.
        </p>
      </div>
    </main>
  );
}
