import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Building2, Users, Calendar, Phone,
  Mail, MapPin, Shield, BarChart3,
  Check, Pencil
} from 'lucide-react';

// ── API ───────────────────────────────────────────────────────
const getParametres = () =>
  api.get('/parametres').then(r => r.data);
const updateParametres = (data) =>
  api.put('/parametres', data);
const getStats = () =>
  api.get('/parametres/stats').then(r => r.data);

// ── STAT CARD ─────────────────────────────────────────────────
function StatCard({ icon: Icon, title, value, subtitle, color }) {
  const colors = {
    blue:   'bg-blue-900/30 text-blue-400',
    green:  'bg-green-900/30 text-green-400',
    amber:  'bg-amber-900/30 text-amber-400',
    purple: 'bg-purple-900/30 text-purple-400',
    red:    'bg-red-900/30 text-red-400',
  };
  return (
    <div className="bg-[#161b27] border border-[#2e3a50]
      rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center
          justify-center ${colors[color] || colors.blue}`}>
          <Icon size={18} />
        </div>
        <p className="text-xs text-gray-500 font-mono uppercase
          tracking-wider">{title}</p>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export default function Settings() {
  const [tab, setTab]         = useState('profil');
  const [editing, setEditing] = useState(false);
  const queryClient           = useQueryClient();

  const { data: parametresData, isLoading } = useQuery({
    queryKey: ['parametres'],
    queryFn: getParametres
  });

  const { data: statsData } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats
  });

  const p     = parametresData?.parametres || {};
  const stats = statsData || {};

  const [form, setForm] = useState(null);

  // Initialiser le formulaire quand les données arrivent
  const initForm = () => {
    setForm({
      nom:                p.nom                || '',
      description:        p.description        || '',
      lieu_reunion:       p.lieu_reunion        || '',
      periodicite_seance: p.periodicite_seance  || 'hebdo',
      telephone:          p.telephone           || '',
      email:              p.email              || '',
      date_creation_asso: p.date_creation_asso
        ? p.date_creation_asso.split('T')[0] : '',
      roles_actifs: p.roles_actifs || {
        vice_president: true,
        tresorier:      true,
        censeur:        true
      }
    });
    setEditing(true);
  };

  const mutation = useMutation({
    mutationFn: updateParametres,
    onSuccess: () => {
      toast.success('✅ Paramètres mis à jour !');
      queryClient.invalidateQueries(['parametres']);
      setEditing(false);
    },
    onError: (err) => toast.error(
      err.response?.data?.message || 'Erreur'
    )
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Paramètres
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Configuration de {p.nom}
          </p>
        </div>
        {!editing && tab === 'profil' && (
          <button onClick={initForm}
            className="flex items-center gap-2 bg-blue-600
              hover:bg-blue-700 text-white px-4 py-2.5
              rounded-xl font-medium transition">
            <Pencil size={16} /> Modifier
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1e2535] p-1 rounded-xl
        mb-6 w-fit">
        {[
          ['profil',  '🏢 Profil'],
          ['roles',   '👥 Rôles'],
          ['stats',   '📊 Statistiques'],
        ].map(([key, label]) => (
          <button key={key}
            onClick={() => { setTab(key); setEditing(false); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium
              transition ${tab === key
                ? 'bg-[#161b27] text-white shadow'
                : 'text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── PROFIL ── */}
      {tab === 'profil' && (
        <div className="grid grid-cols-3 gap-4 mb-6">

          {/* Stats rapides */}
          <StatCard icon={Users} title="Membres actifs"
            value={p.nb_membres || 0}
            subtitle="dans l'association"
            color="blue" />
          <StatCard icon={Calendar} title="Séances tenues"
            value={p.nb_seances || 0}
            subtitle="depuis le début"
            color="green" />
          <StatCard icon={Building2} title="Tontines actives"
            value={p.nb_tontines || 0}
            subtitle="configurées"
            color="amber" />

          {/* Formulaire profil */}
          <div className="col-span-3">
            {!editing ? (
              // ── VUE ──
              <div className="bg-[#161b27] border border-[#2e3a50]
                rounded-xl p-6">
                <h2 className="text-sm font-semibold text-white
                  mb-5 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-400" />
                  Informations de l'association
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Nom de l'association
                    </p>
                    <p className="text-white font-medium">{p.nom}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Code unique
                    </p>
                    <p className="text-white font-mono bg-[#1e2535]
                      px-3 py-1 rounded-lg inline-block">
                      {p.code_unique}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Description
                    </p>
                    <p className="text-white">
                      {p.description || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Lieu de réunion
                    </p>
                    <p className="text-white">
                      {p.lieu_reunion || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Téléphone
                    </p>
                    <p className="text-white">
                      {p.telephone || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Email
                    </p>
                    <p className="text-white">{p.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Périodicité des séances
                    </p>
                    <p className="text-white capitalize">
                      {p.periodicite_seance === 'hebdo'
                        ? 'Hebdomadaire'
                        : p.periodicite_seance === 'bimensuel'
                          ? 'Bimensuelle'
                          : p.periodicite_seance === 'mensuel'
                            ? 'Mensuelle'
                            : p.periodicite_seance}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Date de création
                    </p>
                    <p className="text-white">
                      {p.date_creation_asso
                        ? new Date(p.date_creation_asso)
                            .toLocaleDateString('fr-FR')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Plan d'abonnement
                    </p>
                    <span className={`px-3 py-1 rounded-lg text-xs
                      font-mono font-bold ${
                      p.plan_abonnement === 'premium'
                        ? 'bg-amber-900/40 text-amber-400'
                        : p.plan_abonnement === 'standard'
                          ? 'bg-blue-900/40 text-blue-400'
                          : 'bg-gray-800 text-gray-400'}`}>
                      {p.plan_abonnement?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // ── FORMULAIRE ÉDITION ──
              <div className="bg-[#161b27] border border-[#2e3a50]
                rounded-xl p-6">
                <h2 className="text-sm font-semibold text-white
                  mb-5">Modifier les informations</h2>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-400
                        mb-2">Nom de l'association</label>
                      <input type="text" value={form.nom}
                        onChange={e => setForm({
                          ...form, nom: e.target.value
                        })}
                        className="w-full bg-[#1e2535] border
                          border-[#2e3a50] rounded-xl px-4 py-3
                          text-white focus:outline-none
                          focus:border-blue-500"
                        required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400
                        mb-2">Lieu de réunion</label>
                      <input type="text" value={form.lieu_reunion}
                        onChange={e => setForm({
                          ...form, lieu_reunion: e.target.value
                        })}
                        placeholder="Ex: Salle CRTV Akwa"
                        className="w-full bg-[#1e2535] border
                          border-[#2e3a50] rounded-xl px-4 py-3
                          text-white placeholder-gray-600
                          focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400
                        mb-2">Téléphone</label>
                      <input type="tel" value={form.telephone}
                        onChange={e => setForm({
                          ...form, telephone: e.target.value
                        })}
                        placeholder="+237690000000"
                        className="w-full bg-[#1e2535] border
                          border-[#2e3a50] rounded-xl px-4 py-3
                          text-white placeholder-gray-600
                          focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400
                        mb-2">Email</label>
                      <input type="email" value={form.email}
                        onChange={e => setForm({
                          ...form, email: e.target.value
                        })}
                        placeholder="contact@association.cm"
                        className="w-full bg-[#1e2535] border
                          border-[#2e3a50] rounded-xl px-4 py-3
                          text-white placeholder-gray-600
                          focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400
                        mb-2">Périodicité des séances</label>
                      <select value={form.periodicite_seance}
                        onChange={e => setForm({
                          ...form, periodicite_seance: e.target.value
                        })}
                        className="w-full bg-[#1e2535] border
                          border-[#2e3a50] rounded-xl px-4 py-3
                          text-white focus:outline-none
                          focus:border-blue-500">
                        <option value="hebdo">Hebdomadaire</option>
                        <option value="bimensuel">Bimensuelle</option>
                        <option value="mensuel">Mensuelle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400
                        mb-2">Date de création</label>
                      <input type="date"
                        value={form.date_creation_asso}
                        onChange={e => setForm({
                          ...form,
                          date_creation_asso: e.target.value
                        })}
                        className="w-full bg-[#1e2535] border
                          border-[#2e3a50] rounded-xl px-4 py-3
                          text-white focus:outline-none
                          focus:border-blue-500" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs text-gray-400
                      mb-2">Description</label>
                    <textarea value={form.description}
                      onChange={e => setForm({
                        ...form, description: e.target.value
                      })}
                      placeholder="Décrivez votre association..."
                      rows={3}
                      className="w-full bg-[#1e2535] border
                        border-[#2e3a50] rounded-xl px-4 py-3
                        text-white placeholder-gray-600
                        focus:outline-none focus:border-blue-500
                        resize-none" />
                  </div>

                  <div className="flex gap-3">
                    <button type="button"
                      onClick={() => setEditing(false)}
                      className="flex-1 bg-[#1e2535] border
                        border-[#2e3a50] text-gray-400 py-3
                        rounded-xl hover:text-white transition">
                      Annuler
                    </button>
                    <button type="submit"
                      disabled={mutation.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700
                        text-white py-3 rounded-xl font-semibold
                        transition flex items-center justify-center
                        gap-2 disabled:opacity-50">
                      <Check size={16} />
                      {mutation.isPending
                        ? 'Enregistrement...'
                        : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RÔLES ── */}
      {tab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-[#161b27] border border-[#2e3a50]
            rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-2
              flex items-center gap-2">
              <Shield size={16} className="text-blue-400" />
              Rôles actifs dans l'association
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Activez ou désactivez les rôles optionnels selon
              la structure de votre association.
              Les rôles désactivés n'apparaîtront pas dans
              les interfaces.
            </p>

            {/* Rôles fixes */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 font-mono
                uppercase tracking-wider mb-3">
                Rôles permanents
              </p>
              {[
                { role: 'president',  label: 'Président',
                  desc: 'Autorité suprême de l\'association' },
                { role: 'secretaire', label: 'Secrétaire',
                  desc: 'Opérateur principal de l\'application' },
                { role: 'cac',        label: 'Commissaire aux Comptes',
                  desc: 'Auditeur indépendant' },
                { role: 'membre',     label: 'Membre / Adhérent',
                  desc: 'Participant actif' },
              ].map(r => (
                <div key={r.role}
                  className="flex items-center justify-between
                    py-3 border-b border-[#2e3a50] last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {r.label}
                    </p>
                    <p className="text-xs text-gray-500">{r.desc}</p>
                  </div>
                  <span className="bg-green-900/40 text-green-400
                    px-3 py-1 rounded-lg text-xs font-mono">
                    Toujours actif
                  </span>
                </div>
              ))}
            </div>

            {/* Rôles optionnels */}
            <div>
              <p className="text-xs text-gray-500 font-mono
                uppercase tracking-wider mb-3">
                Rôles optionnels
              </p>
              {[
                { key: 'vice_president',
                  label: 'Vice-Président',
                  desc: 'Suppléant du Président',
                  color: 'teal' },
                { key: 'tresorier',
                  label: 'Trésorier',
                  desc: 'Gardien de la caisse physique',
                  color: 'amber' },
                { key: 'censeur',
                  label: 'Censeur',
                  desc: 'Garant de la discipline',
                  color: 'red' },
              ].map(r => {
                const rolesActifs = p.roles_actifs || {
                  vice_president: true,
                  tresorier:      true,
                  censeur:        true
                };
                const isActive = rolesActifs[r.key] !== false;
                const colorMap = {
                  teal:  'bg-teal-900/40 text-teal-400',
                  amber: 'bg-amber-900/40 text-amber-400',
                  red:   'bg-red-900/40 text-red-400',
                };

                return (
                  <div key={r.key}
                    className="flex items-center justify-between
                      py-3 border-b border-[#2e3a50] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-0.5 rounded text-xs
                        font-mono ${colorMap[r.color]}`}>
                        opt
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {r.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {r.desc}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const newRoles = {
                          ...(p.roles_actifs || {}),
                          [r.key]: !isActive
                        };
                        try {
                          await updateParametres({
                            roles_actifs: newRoles
                          });
                          toast.success(
                            `${r.label} ${!isActive
                              ? 'activé' : 'désactivé'} !`
                          );
                          queryClient.invalidateQueries(
                            ['parametres']
                          );
                        } catch {
                          toast.error('Erreur');
                        }
                      }}
                      className={`relative w-12 h-6 rounded-full
                        transition-colors duration-200 ${
                        isActive ? 'bg-blue-600' : 'bg-[#252d40]'}`}>
                      <div className={`absolute top-1 w-4 h-4
                        rounded-full bg-white transition-all
                        duration-200 ${
                        isActive ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info cumul de rôles */}
          <div className="bg-blue-900/20 border border-blue-800/30
            rounded-xl p-4">
            <p className="text-blue-400 text-sm font-medium mb-1">
              💡 Cumul de rôles
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Un membre peut cumuler plusieurs rôles selon la taille
              de votre association. Par exemple, le Secrétaire peut
              aussi être Trésorier dans une petite structure.
              Le cumul se configure au niveau de chaque membre
              depuis la page Membres.
            </p>
          </div>
        </div>
      )}

      {/* ── STATISTIQUES ── */}
      {tab === 'stats' && (
        <div className="space-y-4">

          {/* Stats membres par rôle */}
          <div className="bg-[#161b27] border border-[#2e3a50]
            rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4
              flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              Membres par rôle
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {stats.membres_par_role?.map(r => (
                <div key={r.role}
                  className="bg-[#1e2535] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-white">
                    {r.nb}
                  </p>
                  <p className="text-xs text-gray-500 capitalize mt-1">
                    {r.role}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats prêts */}
          <div className="bg-[#161b27] border border-[#2e3a50]
            rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4
              flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-400" />
              Statistiques des prêts
            </h2>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-amber-900/20 border
                border-amber-800/30 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {stats.prets_stats?.en_cours || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  En cours
                </p>
              </div>
              <div className="bg-green-900/20 border
                border-green-800/30 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {stats.prets_stats?.soldes || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Soldés</p>
              </div>
              <div className="bg-blue-900/20 border
                border-blue-800/30 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {stats.prets_stats?.en_attente || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  En attente
                </p>
              </div>
              <div className="bg-red-900/20 border
                border-red-800/30 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-red-400">
                  {parseFloat(
                    stats.prets_stats?.total_restant || 0
                  ).toLocaleString('fr-FR')} F
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Reste à recouvrer
                </p>
              </div>
            </div>
          </div>

          {/* Épargnes par rubrique */}
          {stats.epargnes_par_rubrique?.length > 0 && (
            <div className="bg-[#161b27] border border-[#2e3a50]
              rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4
                flex items-center gap-2">
                <BarChart3 size={16} className="text-green-400" />
                Épargnes par rubrique
              </h2>
              <div className="space-y-3">
                {stats.epargnes_par_rubrique.map((e, i) => (
                  <div key={i}
                    className="flex items-center justify-between
                      py-2 border-b border-[#2e3a50] last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">
                        {e.nom}
                      </p>
                      <p className="text-xs text-gray-500">
                        {e.nb_membres} membre(s)
                      </p>
                    </div>
                    <p className="text-green-400 font-mono font-bold">
                      {parseFloat(e.total_epargne)
                        .toLocaleString('fr-FR')} F
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dernières séances */}
          {stats.dernieres_seances?.length > 0 && (
            <div className="bg-[#161b27] border border-[#2e3a50]
              rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4
                flex items-center gap-2">
                <Calendar size={16} className="text-purple-400" />
                Dernières séances
              </h2>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-5 gap-3 px-3 py-2
                  bg-[#1e2535] rounded-lg mb-2 text-xs text-gray-500
                  font-mono uppercase tracking-wider">
                  <div>N°</div>
                  <div>Date</div>
                  <div>Cotisations</div>
                  <div>Caisse</div>
                  <div>Statut</div>
                </div>
                {stats.dernieres_seances.map(s => (
                  <div key={s.numero}
                    className="grid grid-cols-5 gap-3 px-3 py-2
                      border-b border-[#2e3a50] last:border-0
                      text-sm items-center">
                    <div className="text-white font-mono">
                      #{s.numero}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(s.date_seance)
                        .toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-green-400 font-mono text-xs">
                      {parseFloat(s.total_cotise || 0)
                        .toLocaleString('fr-FR')} F
                    </div>
                    <div className="text-blue-400 font-mono text-xs">
                      {parseFloat(s.caisse_theorique || 0)
                        .toLocaleString('fr-FR')} F
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-0.5
                        rounded font-mono ${
                        parseFloat(s.ecart || 0) === 0
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-red-900/40 text-red-400'}`}>
                        {parseFloat(s.ecart || 0) === 0
                          ? '✅ OK' : '⚠️ Écart'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}