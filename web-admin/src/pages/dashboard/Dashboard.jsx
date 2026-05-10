import { useQuery } from '@tanstack/react-query';
import { getMembers } from '../../api/members';
import StatCard from '../../components/ui/StatCard';
import useAuthStore from '../../store/authStore';
import { Users, Wallet, TrendingUp, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { membre } = useAuthStore();

  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers().then(r => r.data)
  });

  const membres = membersData?.membres || [];
  const actifs = membres.filter(m => m.statut === 'actif').length;
  const bureau = membres.filter(m =>
    ['president','secretaire','tresorier','cac','censeur'].includes(m.role)
  ).length;

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
          title="Membres actifs"
          value={actifs}
          subtitle={`dont ${bureau} membres du bureau`}
          color="blue"
        />
        <StatCard
          title="Caisse disponible"
          value="10 000 F"
          subtitle="FCFA · liquidités"
          color="green"
          trend={{ up: true, label: 'Séance #1 clôturée' }}
        />
        <StatCard
          title="Tontines actives"
          value="2"
          subtitle="Grande + Petite Tontine"
          color="amber"
        />
        <StatCard
          title="Séances tenues"
          value="1"
          subtitle="Depuis le début"
          color="purple"
        />
      </div>

      {/* Liste membres récents */}
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Users size={16} className="text-blue-400" />
          Membres de l'association
        </h2>

        <div className="grid grid-cols-6 gap-3 px-3 py-2 bg-[#1e2535] rounded-lg mb-3 text-xs text-gray-500 font-mono uppercase tracking-wider">
          <div className="col-span-2">Nom</div>
          <div>Téléphone</div>
          <div>Rôle</div>
          <div>Score</div>
          <div>Statut</div>
        </div>

        {membres.map(m => (
          <div key={m.id}
            className="grid grid-cols-6 gap-3 px-3 py-3 border-b border-[#2e3a50] last:border-0 text-sm items-center"
          >
            <div className="col-span-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center text-xs font-bold">
                {m.nom_complet.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <span className="text-white font-medium">{m.nom_complet}</span>
            </div>
            <div className="text-gray-400 font-mono text-xs">{m.telephone}</div>
            <div>
              <span className={`px-2 py-1 rounded-md text-xs font-mono font-medium
                ${m.role === 'president' ? 'bg-blue-900/40 text-blue-400' :
                  m.role === 'secretaire' ? 'bg-green-900/40 text-green-400' :
                  m.role === 'tresorier' ? 'bg-amber-900/40 text-amber-400' :
                  m.role === 'cac' ? 'bg-purple-900/40 text-purple-400' :
                  m.role === 'censeur' ? 'bg-red-900/40 text-red-400' :
                  'bg-gray-800 text-gray-400'}`}>
                {m.role}
              </span>
            </div>
            <div className="text-white font-mono">{m.score_fiabilite}/100</div>
            <div>
              <span className="bg-green-900/40 text-green-400 px-2 py-1 rounded-md text-xs font-mono">
                {m.statut}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}