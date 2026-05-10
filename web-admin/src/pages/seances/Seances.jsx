import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Play, Users, CreditCard,
  Lock, RefreshCw, Check, X
} from 'lucide-react';

// ── API ───────────────────────────────────────────────────────
const getSeances = () => api.get('/seances').then(r => r.data);
const ouvrirSeance = () => api.post('/seances', {});
const getCaisse = (id) => api.get(`/seances/${id}/caisse`).then(r => r.data);
const pointer = (id, pointages) =>
  api.post(`/seances/${id}/pointage`, { pointages });
const saisirTx = (id, data) =>
  api.post(`/seances/${id}/transactions`, data);
const cloturerSeance = (id, data) =>
  api.post(`/seances/${id}/cloture`, data);

// ── MODAL POINTAGE ────────────────────────────────────────────
function PointageModal({ seanceId, membres, onClose, onDone }) {
  const [pointages, setPointages] = useState(
    membres.map(m => ({ member_id: m.id, statut: 'present', nom: m.nom_complet }))
  );

  const toggle = (id, statut) => {
    setPointages(prev =>
      prev.map(p => p.member_id === id ? { ...p, statut } : p)
    );
  };

  const handleSubmit = async () => {
    try {
      await pointer(seanceId, pointages.map(p => ({
        member_id: p.member_id, statut: p.statut
      })));
      toast.success('Pointage enregistré !');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const presents  = pointages.filter(p => p.statut === 'present').length;
  const absents   = pointages.filter(p => p.statut === 'absent').length;
  const excuses   = pointages.filter(p => p.statut === 'excuse').length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Pointage des présences</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-400">{presents}</p>
            <p className="text-xs text-gray-500">Présents</p>
          </div>
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-400">{absents}</p>
            <p className="text-xs text-gray-500">Absents</p>
          </div>
          <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-400">{excuses}</p>
            <p className="text-xs text-gray-500">Excusés</p>
          </div>
        </div>

        {/* Liste membres */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {pointages.map(p => (
            <div key={p.member_id}
              className="flex items-center gap-3 bg-[#1e2535] rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {p.nom.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <span className="flex-1 text-white text-sm">{p.nom}</span>
              <div className="flex gap-1">
                {['present','absent','excuse'].map(s => (
                  <button key={s}
                    onClick={() => toggle(p.member_id, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition
                      ${p.statut === s
                        ? s === 'present' ? 'bg-green-600 text-white'
                          : s === 'absent' ? 'bg-red-600 text-white'
                          : 'bg-amber-600 text-white'
                        : 'bg-[#252d40] text-gray-500 hover:text-white'}`}>
                    {s === 'present' ? 'Présent'
                      : s === 'absent' ? 'Absent' : 'Excusé'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2">
          <Check size={16} />
          Valider le pointage
        </button>
      </div>
    </div>
  );
}

// ── MODAL TRANSACTION ─────────────────────────────────────────
function TransactionModal({ seanceId, membres, rubriques, onClose, onDone }) {
  const [form, setForm] = useState({
    member_id:        '',
    type_transaction: 'cotisation',
    montant:          '',
    sens:             'credit',
    rubrique_id:      '',
  });

  const types = [
    { value: 'cotisation',    label: 'Cotisation tontine',  sens: 'credit' },
    { value: 'remboursement', label: 'Remboursement prêt',  sens: 'credit' },
    { value: 'gav_depot',     label: 'Dépôt GAV',           sens: 'credit' },
    { value: 'gav_retrait',   label: 'Retrait GAV',         sens: 'debit'  },
    { value: 'benefice',      label: 'Bénéfice (bouffer)',  sens: 'debit'  },
    { value: 'pret',          label: 'Octroi de prêt',      sens: 'debit'  },
  ];

  const handleTypeChange = (type) => {
    const found = types.find(t => t.value === type);
    setForm({ ...form, type_transaction: type, sens: found?.sens || 'credit' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saisirTx(seanceId, {
        member_id:        form.member_id,
        type_transaction: form.type_transaction,
        montant:          parseFloat(form.montant),
        sens:             form.sens,
        rubrique_id:      form.rubrique_id || undefined,
      });
      toast.success('Transaction enregistrée !');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Nouvelle transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Membre */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Membre</label>
            <select value={form.member_id}
              onChange={e => setForm({...form, member_id: e.target.value})}
              className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              required>
              <option value="">Sélectionner un membre</option>
              {membres.map(m => (
                <option key={m.id} value={m.id}>{m.nom_complet}</option>
              ))}
            </select>
          </div>

          {/* Type transaction */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Type de transaction</label>
            <select value={form.type_transaction}
              onChange={e => handleTypeChange(e.target.value)}
              className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
              {types.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Rubrique (si prêt ou remboursement) */}
          {['pret','remboursement'].includes(form.type_transaction) && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Rubrique</label>
              <select value={form.rubrique_id}
                onChange={e => setForm({...form, rubrique_id: e.target.value})}
                className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                <option value="">Sélectionner une rubrique</option>
                {rubriques.map(r => (
                  <option key={r.id} value={r.id}>{r.nom}</option>
                ))}
              </select>
            </div>
          )}

          {/* Montant */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Montant (FCFA)</label>
            <input type="number" min="1" value={form.montant}
              onChange={e => setForm({...form, montant: e.target.value})}
              placeholder="Ex: 5000"
              className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              required />
          </div>

          {/* Sens */}
          <div className="mb-6 flex items-center gap-3 bg-[#1e2535] rounded-xl px-4 py-3">
            <div className={`w-3 h-3 rounded-full ${form.sens === 'credit' ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-400">
              Sens : <span className={`font-semibold ${form.sens === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                {form.sens === 'credit' ? 'Entrée caisse (+)' : 'Sortie caisse (-)'}
              </span>
            </span>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#1e2535] border border-[#2e3a50] text-gray-400 py-3 rounded-xl hover:text-white transition">
              Annuler
            </button>
            <button type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2">
              <Check size={16} />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── MODAL CLÔTURE ─────────────────────────────────────────────
function CloturModal({ seance, caisse, onClose, onDone }) {
  const [caissePhysique, setCaissePhysique] = useState('');
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);

  const ecart = caissePhysique
    ? parseFloat(caissePhysique) - parseFloat(caisse.theorique) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (ecart !== 0 && !justification) {
      toast.error('Justification obligatoire si écart de caisse !');
      return;
    }
    setLoading(true);
    try {
      await cloturerSeance(seance.id, {
        caisse_physique: parseFloat(caissePhysique),
        justification_ecart: justification || undefined,
      });
      toast.success(`Séance #${seance.numero} clôturée !`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Clôturer la séance #{seance.numero}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Caisse théorique */}
        <div className="bg-[#1e2535] rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-500 mb-1">Caisse théorique (calculée)</p>
          <p className="text-2xl font-bold text-blue-400 font-mono">
            {parseFloat(caisse.theorique).toLocaleString('fr-FR')} F
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Caisse physique */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Caisse physique (comptée)
            </label>
            <input type="number" min="0"
              value={caissePhysique}
              onChange={e => setCaissePhysique(e.target.value)}
              placeholder="Montant compté en FCFA"
              className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-lg font-mono"
              required />
          </div>

          {/* Affichage de l'écart */}
          {ecart !== null && (
            <div className={`rounded-xl p-4 mb-4 ${
              ecart === 0
                ? 'bg-green-900/20 border border-green-800/30'
                : ecart > 0
                  ? 'bg-blue-900/20 border border-blue-800/30'
                  : 'bg-red-900/20 border border-red-800/30'}`}>
              <p className="text-xs text-gray-500 mb-1">Écart</p>
              <p className={`text-xl font-bold font-mono
                ${ecart === 0 ? 'text-green-400'
                  : ecart > 0 ? 'text-blue-400'
                  : 'text-red-400'}`}>
                {ecart > 0 ? '+' : ''}{ecart.toLocaleString('fr-FR')} F
              </p>
              <p className="text-xs mt-1 text-gray-500">
                {ecart === 0 ? '✅ Caisse parfaite !'
                  : ecart > 0 ? '📈 Excédent de caisse'
                  : '⚠️ Déficit de caisse'}
              </p>
            </div>
          )}

          {/* Justification si écart */}
          {ecart !== null && ecart !== 0 && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Justification de l'écart (obligatoire)
              </label>
              <textarea
                value={justification}
                onChange={e => setJustification(e.target.value)}
                placeholder="Expliquez la raison de l'écart..."
                rows={3}
                className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                required />
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#1e2535] border border-[#2e3a50] text-gray-400 py-3 rounded-xl hover:text-white transition">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50">
              <Lock size={16} />
              {loading ? 'Clôture...' : 'Clôturer la séance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────
export default function Seances() {
  const [activeSeance, setActiveSeance] = useState(null);
  const [caisse, setCaisse] = useState(null);
  const [showPointage, setShowPointage] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [showCloture, setShowCloture] = useState(false);
  const queryClient = useQueryClient();

  const { data: membresData } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/members').then(r => r.data)
  });

  const { data: rubriquesData } = useQuery({
    queryKey: ['rubriques'],
    queryFn: () => api.get('/pret-rubriques').then(r => r.data)
  });

  const membres  = membresData?.membres   || [];
  const rubriques = rubriquesData?.rubriques || [];

  const refreshCaisse = async (id) => {
    try {
      const data = await getCaisse(id);
      setCaisse(data.caisse);
      setActiveSeance(data.seance);
    } catch (err) {
      console.error(err);
    }
  };

  const ouvrirMutation = useMutation({
    mutationFn: ouvrirSeance,
    onSuccess: async (res) => {
      const seance = res.data.seance;
      toast.success(`Séance #${seance.numero} ouverte !`);
      await refreshCaisse(seance.id);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  });

  const txTypes = {
    cotisation:    { label: 'Cotisation',  color: 'text-green-400'  },
    remboursement: { label: 'Rembt.',      color: 'text-blue-400'   },
    gav_depot:     { label: 'GAV +',       color: 'text-green-400'  },
    gav_retrait:   { label: 'GAV -',       color: 'text-amber-400'  },
    benefice:      { label: 'Bénéfice',    color: 'text-purple-400' },
    pret:          { label: 'Prêt',        color: 'text-red-400'    },
    penalite_absence: { label: 'Pénalité', color: 'text-red-400'    },
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Séances</h1>
          <p className="text-gray-400 text-sm mt-1">
            Gestion des séances en temps réel
          </p>
        </div>
        {!activeSeance && (
          <button
            onClick={() => ouvrirMutation.mutate()}
            disabled={ouvrirMutation.isPending}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50"
          >
            <Play size={16} />
            Ouvrir une séance
          </button>
        )}
      </div>

      {/* Pas de séance active */}
      {!activeSeance && (
        <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Play size={28} className="text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Aucune séance en cours
          </h2>
          <p className="text-gray-500 mb-6">
            Cliquez sur "Ouvrir une séance" pour démarrer
          </p>
        </div>
      )}

      {/* Séance active */}
      {activeSeance && (
        <>
          {/* Bandeau séance */}
          <div className="bg-green-900/20 border border-green-800/30 rounded-xl px-5 py-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-green-400 font-medium">
                Séance #{activeSeance.numero} en cours
              </span>
              <span className="text-gray-500 text-sm">
                Ouverte par {activeSeance.ouvert_par}
              </span>
            </div>
            <button
              onClick={() => setShowCloture(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Lock size={14} />
              Clôturer
            </button>
          </div>

          {/* Stats caisse */}
          {caisse && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl p-4">
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
                  Caisse théorique
                </p>
                <p className="text-2xl font-bold text-blue-400 font-mono">
                  {parseFloat(caisse.theorique).toLocaleString('fr-FR')} F
                </p>
              </div>
              <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl p-4">
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
                  Total entrées
                </p>
                <p className="text-2xl font-bold text-green-400 font-mono">
                  +{parseFloat(caisse.total_entrees || 0).toLocaleString('fr-FR')} F
                </p>
              </div>
              <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl p-4">
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
                  Total sorties
                </p>
                <p className="text-2xl font-bold text-red-400 font-mono">
                  -{parseFloat(caisse.total_sorties || 0).toLocaleString('fr-FR')} F
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setShowPointage(true)}
              className="bg-[#161b27] border border-[#2e3a50] hover:border-blue-800/50 rounded-xl p-5 text-left transition group"
            >
              <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-900/50 transition">
                <Users size={18} className="text-blue-400" />
              </div>
              <p className="text-white font-medium">Pointer les présences</p>
              <p className="text-xs text-gray-500 mt-1">
                Marquer présent / absent / excusé
              </p>
            </button>

            <button
              onClick={() => setShowTransaction(true)}
              className="bg-[#161b27] border border-[#2e3a50] hover:border-green-800/50 rounded-xl p-5 text-left transition group"
            >
              <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-900/50 transition">
                <CreditCard size={18} className="text-green-400" />
              </div>
              <p className="text-white font-medium">Saisir une transaction</p>
              <p className="text-xs text-gray-500 mt-1">
                Cotisation, prêt, GAV, bénéfice
              </p>
            </button>

            <button
              onClick={() => refreshCaisse(activeSeance.id)}
              className="bg-[#161b27] border border-[#2e3a50] hover:border-amber-800/50 rounded-xl p-5 text-left transition group"
            >
              <div className="w-10 h-10 bg-amber-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-900/50 transition">
                <RefreshCw size={18} className="text-amber-400" />
              </div>
              <p className="text-white font-medium">Actualiser la caisse</p>
              <p className="text-xs text-gray-500 mt-1">
                Voir les dernières transactions
              </p>
            </button>
          </div>

          {/* Journal des transactions */}
          {caisse && (
            <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2e3a50]">
                <h2 className="text-sm font-semibold text-white">
                  Journal des transactions
                </h2>
              </div>

              {caisse.transactions?.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucune transaction pour l'instant
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-5 gap-3 px-5 py-2 bg-[#1e2535] text-xs text-gray-500 font-mono uppercase tracking-wider">
                    <div className="col-span-2">Description</div>
                    <div>Membre</div>
                    <div>Montant</div>
                    <div>Hash</div>
                  </div>
                  {caisse.transactions?.map(tx => (
                    <div key={tx.id}
                      className="grid grid-cols-5 gap-3 px-5 py-3 border-b border-[#2e3a50] last:border-0 items-center hover:bg-[#1e2535]/50 transition text-sm">
                      <div className="col-span-2">
                        <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md mr-2
                          ${tx.sens === 'credit' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                          {tx.sens === 'credit' ? '+' : '-'}
                        </span>
                        <span className={txTypes[tx.type_transaction]?.color || 'text-white'}>
                          {txTypes[tx.type_transaction]?.label || tx.type_transaction}
                        </span>
                      </div>
                      <div className="text-gray-400 text-xs truncate">
                        {tx.membre_nom}
                      </div>
                      <div className={`font-mono font-bold text-sm
                        ${tx.sens === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.sens === 'credit' ? '+' : '-'}
                        {parseFloat(tx.montant).toLocaleString('fr-FR')} F
                      </div>
                      <div className="text-gray-600 font-mono text-xs truncate">
                        {tx.signature_hash?.slice(0, 8)}...
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showPointage && (
        <PointageModal
          seanceId={activeSeance.id}
          membres={membres}
          onClose={() => setShowPointage(false)}
          onDone={() => refreshCaisse(activeSeance.id)}
        />
      )}

      {showTransaction && (
        <TransactionModal
          seanceId={activeSeance.id}
          membres={membres}
          rubriques={rubriques}
          onClose={() => setShowTransaction(false)}
          onDone={() => refreshCaisse(activeSeance.id)}
        />
      )}

      {showCloture && caisse && (
        <CloturModal
          seance={activeSeance}
          caisse={caisse}
          onClose={() => setShowCloture(false)}
          onDone={() => {
            setActiveSeance(null);
            setCaisse(null);
          }}
        />
      )}
    </div>
  );
}