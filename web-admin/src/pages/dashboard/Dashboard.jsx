import { useQuery } from '@tanstack/react-query';
import { getMembers } from '../../api/members';
import StatCard from '../../components/ui/StatCard';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

// API Dashboard
const getDashboardStats = () =>
  api.get('/dashboard/stats').then(r => r.data);

export default function Dashboard() {
  const { membre } = useAuthStore();

  const { data: membresData } = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers().then(r => r.data),
    refetchInterval: 30000 // Rafraîchir toutes les 30s
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000
  });

  const { data: tontinesData } = useQuery({
    queryKey: ['tontines'],
    queryFn: () => api.get('/tontines').then(r => r.data),
    refetchInterval: 30000
  });

  const membres  = membresData?.membres   || [];
  const tontines = tontinesData?.tontines || [];
  const actifs   = membres.filter(m => m.statut === 'actif').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Bonjour, {membre?.nom?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {membre?.association} · {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Caisse disponible"
          value={stats
            ? `${parseFloat(stats.caisse_disponible || 0)
                .toLocaleString('fr-FR')} F`
            : '...'}
          subtitle="FCFA · dernière séance clôturée"
          color="green"
        />
        <StatCard
          title="Membres actifs"
          value={actifs}
          subtitle={`sur ${membres.length} membres total`}
          color="blue"
        />
        <StatCard
          title="Tontines actives"
          value={tontines.filter(t => t.statut === 'actif').length}
          subtitle="configurées et en cours"
          color="amber"
        />
        <StatCard
          title="Séances tenues"
          value={stats?.nb_seances_closes || 0}
          subtitle="depuis le début"
          color="purple"
        />
      </div>

      {/* Prêts en cours */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl p-5">
          <p className="text-xs text-gray-500 font-mono uppercase
            tracking-wider mb-4">Prêts en cours</p>
          {stats?.prets_en_cours?.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun prêt en cours</p>
          ) : (
            stats?.prets_en_cours?.slice(0, 5).map((p, i) => (
              <div key={i}
                className="flex justify-between py-2 border-b
                  border-[#2e3a50] last:border-0 text-sm">
                <div>
                  <p className="text-white">{p.nom_complet}</p>
                  <p className="text-xs text-gray-500">{p.rubrique_nom}</p>
                </div>
                <span className="text-red-400 font-mono">
                  {parseFloat(p.reste_a_regler)
                    .toLocaleString('fr-FR')} F
                </span>
              </div>
            ))
          )}
        </div>

        <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl p-5">
          <p className="text-xs text-gray-500 font-mono uppercase
            tracking-wider mb-4">Membres</p>
          {membres.slice(0, 6).map(m => (
            <div key={m.id}
              className="flex items-center justify-between py-2
                border-b border-[#2e3a50] last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-900/40
                  text-blue-400 flex items-center justify-center
                  text-xs font-bold">
                  {m.nom_complet.split(' ')
                    .map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm">{m.nom_complet}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {m.role}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md font-mono ${
                m.statut === 'actif'
                  ? 'bg-green-900/40 text-green-400'
                  : 'bg-red-900/40 text-red-400'}`}>
                {m.statut}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tontines */}
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl p-5">
        <p className="text-xs text-gray-500 font-mono uppercase
          tracking-wider mb-4">Tontines actives</p>
        <div className="grid grid-cols-2 gap-4">
          {tontines.filter(t => t.statut === 'actif').map(t => (
            <div key={t.id}
              className="bg-[#1e2535] rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-white font-medium">{t.nom}</p>
                <span className="text-xs bg-green-900/40 text-green-400
                  px-2 py-1 rounded-md font-mono">Actif</span>
              </div>
              <p className="text-2xl font-bold text-amber-400 font-mono mb-1">
                {parseFloat(t.montant_part).toLocaleString('fr-FR')} F
              </p>
              <p className="text-xs text-gray-500">par part · {t.periodicite}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs
                  text-gray-500 mb-1">
                  <span>Progression du cycle</span>
                  <span>
                    {t.seance_courante || 0} /
                    {t.nb_seances_cycle || 52}
                  </span>
                </div>
                <div className="h-2 bg-[#252d40] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        ((t.seance_courante || 0) /
                        (t.nb_seances_cycle || 52)) * 100, 100
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}