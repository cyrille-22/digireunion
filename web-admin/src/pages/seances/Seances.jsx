import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Play, Users, CreditCard, Lock,
  RefreshCw, ChevronRight, ChevronLeft,
  Eye, X, Check, AlertCircle
} from 'lucide-react';

// ── API ───────────────────────────────────────────────────────
const getSeanceOuverte = () =>
  api.get('/seances/ouverte').then(r => r.data).catch(() => null);
const ouvrirSeance = (data) => api.post('/seances', data);
const getCaisse = (id) => api.get(`/seances/${id}/caisse`).then(r => r.data);
const pointer = (id, pointages) =>
  api.post(`/seances/${id}/pointage`, { pointages });
const cloturerSeance = (id, data) =>
  api.post(`/seances/${id}/cloture`, data);
const getHistorique = (page) =>
  api.get(`/cotisations/historique?page=${page}`).then(r => r.data);
const getBilan = (id) =>
  api.get(`/cotisations/bilan/${id}`).then(r => r.data);
const getMembresTontine = (id) =>
  api.get(`/cotisations/tontine/${id}/membres`).then(r => r.data);
const saisirCotisations = (data) =>
  api.post('/cotisations', data);

// ── MODAL OUVERTURE SÉANCE ────────────────────────────────────
function OuvertureModal({ membres, seancePrecedente, onClose, onOuvrir }) {
  const [presidentId, setPresidentId] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(seancePrecedente ? 1 : 2);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Étape 1 — Rappel séance précédente */}
        {step === 1 && seancePrecedente && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Rappel — Séance #{seancePrecedente.seance?.numero}
              </h2>
              <span className="text-xs text-gray-500 font-mono">
                {new Date(seancePrecedente.seance?.date_seance)
                  .toLocaleDateString('fr-FR')}
              </span>
            </div>

            {/* Présences */}
            <div className="bg-[#1e2535] rounded-xl p-4 mb-3">
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-3">
                Présences
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-xl font-bold text-green-400">
                    {seancePrecedente.presences?.presents || 0}
                  </p>
                  <p className="text-xs text-gray-500">Présents</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-red-400">
                    {seancePrecedente.presences?.absents || 0}
                  </p>
                  <p className="text-xs text-gray-500">Absents</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-400">
                    {seancePrecedente.presences?.excuses || 0}
                  </p>
                  <p className="text-xs text-gray-500">Excusés</p>
                </div>
              </div>
            </div>

            {/* Cotisations */}
            {seancePrecedente.cotisations?.map((c, i) => (
              <div key={i} className="bg-[#1e2535] rounded-xl p-4 mb-3">
                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
                  {c.tontine_nom}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    {c.nb_cotises} cotisé(s) · {c.nb_non_cotises} non cotisé(s)
                  </span>
                  <span className="text-green-400 font-mono font-bold">
                    {parseFloat(c.total_cotise).toLocaleString('fr-FR')} F
                  </span>
                </div>
              </div>
            ))}

            {/* Mouvements */}
            <div className="bg-[#1e2535] rounded-xl p-4 mb-3">
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-3">
                Mouvements financiers
              </p>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Total entrées</span>
                <span className="text-green-400 font-mono">
                  +{parseFloat(seancePrecedente.mouvements?.total_entrees || 0)
                    .toLocaleString('fr-FR')} F
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Total sorties</span>
                <span className="text-red-400 font-mono">
                  -{parseFloat(seancePrecedente.mouvements?.total_sorties || 0)
                    .toLocaleString('fr-FR')} F
                </span>
              </div>
            </div>

            {/* Caisse */}
            <div className={`rounded-xl p-4 mb-4 ${
              seancePrecedente.seance?.ecart === '0.00'
                ? 'bg-green-900/20 border border-green-800/30'
                : 'bg-red-900/20 border border-red-800/30'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Caisse clôturée</span>
                <span className="text-white font-mono font-bold">
                  {parseFloat(seancePrecedente.seance?.caisse_theorique || 0)
                    .toLocaleString('fr-FR')} F
                </span>
              </div>
              <p className={`text-xs mt-1 ${
                seancePrecedente.seance?.ecart === '0.00'
                  ? 'text-green-400' : 'text-red-400'}`}>
                {seancePrecedente.seance?.ecart === '0.00'
                  ? '✅ Caisse parfaite' : '⚠️ Écart détecté'}
              </p>
            </div>

            {/* Non cotisés */}
            {seancePrecedente.non_cotises?.length > 0 && (
              <div className="bg-amber-900/20 border border-amber-800/30 rounded-xl p-4 mb-4">
                <p className="text-xs text-amber-400 font-mono uppercase tracking-wider mb-2">
                  Points en suspens
                </p>
                {seancePrecedente.non_cotises.map((nc, i) => (
                  <p key={i} className="text-sm text-gray-300">
                    ⚠️ {nc.nom_complet} — non cotisé ({nc.tontine_nom})
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              Continuer vers l'ouverture
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Étape 2 — Paramètres d'ouverture */}
        {step === 2 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Ouvrir une nouvelle séance
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Président de séance */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Président de séance
              </label>
              <select
                value={presidentId}
                onChange={e => setPresidentId(e.target.value)}
                className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Sélectionner le président de séance</option>
                {membres.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nom_complet} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Notes d'ouverture */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Notes d'ouverture (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Points à aborder lors de cette séance..."
                rows={3}
                className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              {seancePrecedente && (
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 bg-[#1e2535] border border-[#2e3a50] text-gray-400 px-4 py-3 rounded-xl hover:text-white transition"
                >
                  <ChevronLeft size={16} />
                  Rappel
                </button>
              )}
              <button
                onClick={() => {
                  if (!presidentId) {
                    toast.error('Veuillez choisir un président de séance');
                    return;
                  }
                  onOuvrir({ president_seance_id: presidentId, notes_ouverture: notes });
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <Play size={16} />
                Ouvrir la séance
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── MODAL COTISATION INTELLIGENTE ─────────────────────────────
function CotisationModal({ seanceId, tontines, onClose, onDone }) {
  const [selectedTontine, setSelectedTontine] = useState(null);
  const [membresData, setMembresData]         = useState(null);
  const [cotisations, setCotisations]         = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [submitting, setSubmitting]           = useState(false);

  const selectTontine = async (tontine) => {
    setLoading(true);
    try {
      const data = await getMembresTontine(tontine.id);
      setMembresData(data);
      setCotisations(data.membres.map(m => ({
        member_id:  m.member_id,
        nom:        m.nom_complet,
        nb_parts:   m.nb_parts,
        a_cotise:   false,
        montant:    parseFloat(m.montant_du)
      })));
      setSelectedTontine(tontine);
    } catch {
      toast.error('Erreur chargement membres');
    } finally {
      setLoading(false);
    }
  };

  const toggleCotise = (memberId) => {
    setCotisations(prev =>
      prev.map(c => c.member_id === memberId
        ? { ...c, a_cotise: !c.a_cotise } : c)
    );
  };

  const totalAttendu  = cotisations.reduce((s, c) => s + c.montant, 0);
  const totalCotise   = cotisations.filter(c => c.a_cotise)
    .reduce((s, c) => s + c.montant, 0);
  const resteACotiser = totalAttendu - totalCotise;
  const nbCotises     = cotisations.filter(c => c.a_cotise).length;

  const handleSubmit = async () => {
    if (cotisations.filter(c => c.a_cotise).length === 0) {
      toast.error('Cochez au moins un membre ayant cotisé');
      return;
    }
    setSubmitting(true);
    try {
      await saisirCotisations({
        seance_id:   seanceId,
        tontine_id:  selectedTontine.id,
        cotisations: cotisations.map(c => ({
          member_id: c.member_id,
          nb_parts:  c.nb_parts,
          a_cotise:  c.a_cotise
        }))
      });
      toast.success(`✅ Cotisations ${selectedTontine.nom} enregistrées !`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {selectedTontine ? `Cotisation — ${selectedTontine.nom}` : 'Choisir la tontine'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Choix de la tontine */}
        {!selectedTontine && (
          <div className="grid grid-cols-1 gap-3">
            {tontines.map(t => (
              <button key={t.id}
                onClick={() => selectTontine(t)}
                className="bg-[#1e2535] border border-[#2e3a50] hover:border-blue-800/50 rounded-xl p-5 text-left transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{t.nom}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {parseFloat(t.montant_part).toLocaleString('fr-FR')} F/part
                      · {t.periodicite}
                      · {t.mode_attribution === 'tour_role'
                          ? 'Tour de rôle' : 'Tirage au sort'}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Chargement des membres...</p>
          </div>
        )}

        {/* Liste des membres */}
        {selectedTontine && !loading && (
          <>
            {/* Totaux en temps réel */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Total attendu</p>
                <p className="text-lg font-bold text-blue-400 font-mono">
                  {totalAttendu.toLocaleString('fr-FR')} F
                </p>
              </div>
              <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">
                  Total cotisé ({nbCotises})
                </p>
                <p className="text-lg font-bold text-green-400 font-mono">
                  {totalCotise.toLocaleString('fr-FR')} F
                </p>
              </div>
              <div className={`rounded-xl p-3 text-center border ${
                resteACotiser === 0
                  ? 'bg-green-900/20 border-green-800/30'
                  : 'bg-amber-900/20 border-amber-800/30'}`}>
                <p className="text-xs text-gray-500 mb-1">Reste à cotiser</p>
                <p className={`text-lg font-bold font-mono ${
                  resteACotiser === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                  {resteACotiser.toLocaleString('fr-FR')} F
                </p>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progression</span>
                <span>{totalAttendu > 0
                  ? Math.round(totalCotise / totalAttendu * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-[#1e2535] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: totalAttendu > 0
                    ? `${Math.min(totalCotise / totalAttendu * 100, 100)}%` : '0%' }}
                />
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setCotisations(prev =>
                  prev.map(c => ({ ...c, a_cotise: true })))}
                className="text-xs bg-green-900/30 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-900/50 transition"
              >
                ✅ Tout cocher
              </button>
              <button
                onClick={() => setCotisations(prev =>
                  prev.map(c => ({ ...c, a_cotise: false })))}
                className="text-xs bg-red-900/30 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-900/50 transition"
              >
                ❌ Tout décocher
              </button>
            </div>

            {/* Liste membres */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {cotisations.map(c => (
                <div key={c.member_id}
                  onClick={() => toggleCotise(c.member_id)}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 cursor-pointer transition border ${
                    c.a_cotise
                      ? 'bg-green-900/20 border-green-800/30'
                      : 'bg-[#1e2535] border-transparent hover:border-[#3a4960]'}`}
                >
                  {/* Checkbox */}
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition ${
                    c.a_cotise
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-600'}`}>
                    {c.a_cotise && <Check size={14} className="text-white" />}
                  </div>

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    c.a_cotise
                      ? 'bg-green-900/40 text-green-400'
                      : 'bg-blue-900/40 text-blue-400'}`}>
                    {c.nom.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>

                  {/* Nom */}
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${
                      c.a_cotise ? 'text-green-400' : 'text-white'}`}>
                      {c.nom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.nb_parts} part{c.nb_parts > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Montant */}
                  <div className="text-right">
                    <p className={`font-mono font-bold text-sm ${
                      c.a_cotise ? 'text-green-400' : 'text-white'}`}>
                      {c.montant.toLocaleString('fr-FR')} F
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.nb_parts} × {parseFloat(membresData?.montant_part || 0)
                        .toLocaleString('fr-FR')} F
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTontine(null)}
                className="bg-[#1e2535] border border-[#2e3a50] text-gray-400 px-4 py-3 rounded-xl hover:text-white transition flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check size={16} />
                {submitting ? 'Enregistrement...' : `Valider (${nbCotises} membres)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── MODAL BILAN SÉANCE ────────────────────────────────────────
function BilanModal({ seanceId, onClose, onCloturer }) {
  const { data: bilan, isLoading } = useQuery({
    queryKey: ['bilan', seanceId],
    queryFn: () => getBilan(seanceId)
  });

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-8">
        <p className="text-gray-400">Calcul du bilan...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Bilan — Séance #{bilan?.seance?.numero}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Présences */}
        <div className="bg-[#1e2535] rounded-xl p-4 mb-3">
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-3">
            Présences
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xl font-bold text-green-400">
                {bilan?.presences?.presents || 0}
              </p>
              <p className="text-xs text-gray-500">Présents</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-400">
                {bilan?.presences?.absents || 0}
              </p>
              <p className="text-xs text-gray-500">Absents</p>
            </div>
            <div>
              <p className="text-xl font-bold text-amber-400">
                {bilan?.presences?.excuses || 0}
              </p>
              <p className="text-xs text-gray-500">Excusés</p>
            </div>
          </div>
        </div>

        {/* Cotisations par tontine */}
        {bilan?.cotisations?.map((c, i) => (
          <div key={i} className="bg-[#1e2535] rounded-xl p-4 mb-3">
            <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
              {c.tontine_nom}
            </p>
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-3">
                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-md">
                  ✅ {c.nb_cotises} cotisé(s)
                </span>
                <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded-md">
                  ❌ {c.nb_non_cotises} non cotisé(s)
                </span>
              </div>
              <span className="text-green-400 font-mono font-bold">
                {parseFloat(c.total_cotise).toLocaleString('fr-FR')} F
              </span>
            </div>
          </div>
        ))}

        {/* Non cotisés */}
        {bilan?.non_cotises?.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-800/30 rounded-xl p-4 mb-3">
            <p className="text-xs text-amber-400 font-mono uppercase tracking-wider mb-2">
              Membres n'ayant pas cotisé
            </p>
            {bilan.non_cotises.map((nc, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <AlertCircle size={12} className="text-amber-400 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  {nc.nom_complet}
                  <span className="text-gray-500 ml-1">— {nc.tontine_nom}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Mouvements */}
        <div className="bg-[#1e2535] rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-3">
            Mouvements financiers
          </p>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">Total entrées</span>
            <span className="text-green-400 font-mono font-bold">
              +{parseFloat(bilan?.mouvements?.total_entrees || 0)
                .toLocaleString('fr-FR')} F
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">Total sorties</span>
            <span className="text-red-400 font-mono font-bold">
              -{parseFloat(bilan?.mouvements?.total_sorties || 0)
                .toLocaleString('fr-FR')} F
            </span>
          </div>
          {parseInt(bilan?.mouvements?.nb_benefices) > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Bénéfices versés</span>
              <span className="text-purple-400 font-mono">
                {bilan.mouvements.nb_benefices}
              </span>
            </div>
          )}
          {parseInt(bilan?.mouvements?.nb_prets) > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Prêts accordés</span>
              <span className="text-amber-400 font-mono">
                {bilan.mouvements.nb_prets}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-[#1e2535] border border-[#2e3a50] text-gray-400 py-3 rounded-xl hover:text-white transition">
            Continuer la séance
          </button>
          <button onClick={onCloturer}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2">
            <Lock size={16} />
            Clôturer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL CLÔTURE ─────────────────────────────────────────────
function CloturModal({ seance, caisse, onClose, onDone }) {
  const [caissePhysique, setCaissePhysique] = useState('');
  const [justification, setJustification]   = useState('');
  const [loading, setLoading]               = useState(false);

  const ecart = caissePhysique
    ? parseFloat(caissePhysique) - parseFloat(caisse?.theorique || 0) : null;

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
            Clôturer la séance #{seance?.numero}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="bg-[#1e2535] rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-500 mb-1">Caisse théorique</p>
          <p className="text-2xl font-bold text-blue-400 font-mono">
            {parseFloat(caisse?.theorique || 0).toLocaleString('fr-FR')} F
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Caisse physique comptée (FCFA)
            </label>
            <input type="number" min="0"
              value={caissePhysique}
              onChange={e => setCaissePhysique(e.target.value)}
              placeholder="Montant compté en caisse"
              className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-lg font-mono"
              required />
          </div>

          {ecart !== null && (
            <div className={`rounded-xl p-4 mb-4 ${
              ecart === 0 ? 'bg-green-900/20 border border-green-800/30'
                : 'bg-red-900/20 border border-red-800/30'}`}>
              <p className="text-xs text-gray-500 mb-1">Écart</p>
              <p className={`text-xl font-bold font-mono ${
                ecart === 0 ? 'text-green-400' : 'text-red-400'}`}>
                {ecart > 0 ? '+' : ''}{ecart.toLocaleString('fr-FR')} F
              </p>
              <p className="text-xs mt-1 text-gray-500">
                {ecart === 0 ? '✅ Caisse parfaite !'
                  : ecart > 0 ? '📈 Excédent'
                  : '⚠️ Déficit — justification requise'}
              </p>
            </div>
          )}

          {ecart !== null && ecart !== 0 && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Justification obligatoire
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
              {loading ? 'Clôture...' : 'Confirmer la clôture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────
export default function Seances() {
  const [tab, setTab]                     = useState('seance');
  const [activeSeance, setActiveSeance]   = useState(null);
  const [caisse, setCaisse]               = useState(null);
  const [showOuverture, setShowOuverture] = useState(false);
  const [showCotisation, setShowCotisation] = useState(false);
  const [showPointage, setShowPointage]   = useState(false);
  const [showBilan, setShowBilan]         = useState(false);
  const [showCloture, setShowCloture]     = useState(false);
  const [showDetailSeance, setShowDetailSeance] = useState(null);
  const [page, setPage]                   = useState(1);
// Vérifier au chargement s'il existe une séance ouverte
useEffect(() => {
  const checkSeanceOuverte = async () => {
    try {
      const res = await api.get('/seances/ouverte');
      if (res.data.seance) {
        const seance = res.data.seance;
        setActiveSeance(seance);
        // Charger la caisse
        const caisseData = await getCaisse(seance.id);
        setCaisse(caisseData.caisse);
      }
    } catch {
      // Pas de séance ouverte — normal
    }
  };
  checkSeanceOuverte();
}, []);
  const { data: membresData } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/members').then(r => r.data)
  });

  const { data: tontinesData } = useQuery({
    queryKey: ['tontines'],
    queryFn: () => api.get('/tontines').then(r => r.data)
  });

  const { data: historiqueData, refetch: refetchHistorique } = useQuery({
    queryKey: ['historique', page],
    queryFn: () => getHistorique(page),
    enabled: tab === 'historique'
  });

  const membres  = membresData?.membres    || [];
  const tontines = tontinesData?.tontines  || [];

  const refreshCaisse = async (id) => {
    try {
      const data = await getCaisse(id);
      setCaisse(data.caisse);
      setActiveSeance(data.seance);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOuvrir = async (params) => {
    try {
      const res = await ouvrirSeance(params);
      const seance = res.data.seance;
      toast.success(`Séance #${seance.numero} ouverte !`);
      await refreshCaisse(seance.id);
      setShowOuverture(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  // Modal pointage rapide
  const PointageModal = () => {
    const [pointages, setPointages] = useState(
      membres.map(m => ({ member_id: m.id, statut: 'present', nom: m.nom_complet }))
    );
    const toggle = (id, statut) =>
      setPointages(prev => prev.map(p =>
        p.member_id === id ? { ...p, statut } : p));

    const handleSubmit = async () => {
      try {
        await pointer(activeSeance.id,
          pointages.map(p => ({ member_id: p.member_id, statut: p.statut })));
        toast.success('Pointage enregistré !');
        await refreshCaisse(activeSeance.id);
        setShowPointage(false);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Erreur');
      }
    };

    const presents = pointages.filter(p => p.statut === 'present').length;
    const absents  = pointages.filter(p => p.statut === 'absent').length;
    const excuses  = pointages.filter(p => p.statut === 'excuse').length;

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Pointage des présences</h2>
            <button onClick={() => setShowPointage(false)}
              className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[['present','Présents','text-green-400','bg-green-900/20 border-green-800/30', presents],
              ['absent','Absents','text-red-400','bg-red-900/20 border-red-800/30', absents],
              ['excuse','Excusés','text-amber-400','bg-amber-900/20 border-amber-800/30', excuses]
            ].map(([,label,color,bg,count]) => (
              <div key={label} className={`${bg} border rounded-lg p-2 text-center`}>
                <p className={`text-xl font-bold ${color}`}>{count}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
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
                    <button key={s} onClick={() => toggle(p.member_id, s)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-mono transition ${
                        p.statut === s
                          ? s==='present' ? 'bg-green-600 text-white'
                            : s==='absent' ? 'bg-red-600 text-white'
                            : 'bg-amber-600 text-white'
                          : 'bg-[#252d40] text-gray-500 hover:text-white'}`}>
                      {s==='present'?'Présent':s==='absent'?'Absent':'Excusé'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2">
            <Check size={16} /> Valider le pointage
          </button>
        </div>
      </div>
    );
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
        {!activeSeance && tab === 'seance' && (
          <button
            onClick={() => setShowOuverture(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition"
          >
            <Play size={16} /> Ouvrir une séance
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1e2535] p-1 rounded-xl mb-6 w-fit">
        {[['seance','Séance en cours'],['historique','Historique']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === key
                ? 'bg-[#161b27] text-white shadow'
                : 'text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── SÉANCE EN COURS ── */}
      {tab === 'seance' && (
        <>
          {/* Pas de séance */}
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
              {/* Bandeau */}
              <div className="bg-green-900/20 border border-green-800/30 rounded-xl px-5 py-3 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-green-400 font-medium">
                    Séance #{activeSeance.numero} en cours
                  </span>
                  {activeSeance.president_seance_nom && (
                    <span className="text-gray-500 text-sm">
                      Présidée par {activeSeance.president_seance_nom}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBilan(true)}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    <Eye size={14} /> Bilan & Clôture
                  </button>
                </div>
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
                <button onClick={() => setShowPointage(true)}
                  className="bg-[#161b27] border border-[#2e3a50] hover:border-blue-800/50 rounded-xl p-5 text-left transition group">
                  <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-900/50 transition">
                    <Users size={18} className="text-blue-400" />
                  </div>
                  <p className="text-white font-medium">Pointer présences</p>
                  <p className="text-xs text-gray-500 mt-1">Présent / Absent / Excusé</p>
                </button>

                <button onClick={() => setShowCotisation(true)}
                  className="bg-[#161b27] border border-[#2e3a50] hover:border-green-800/50 rounded-xl p-5 text-left transition group">
                  <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-900/50 transition">
                    <CreditCard size={18} className="text-green-400" />
                  </div>
                  <p className="text-white font-medium">Saisir cotisations</p>
                  <p className="text-xs text-gray-500 mt-1">Grande & Petite Tontine</p>
                </button>

                <button onClick={() => refreshCaisse(activeSeance.id)}
                  className="bg-[#161b27] border border-[#2e3a50] hover:border-amber-800/50 rounded-xl p-5 text-left transition group">
                  <div className="w-10 h-10 bg-amber-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-900/50 transition">
                    <RefreshCw size={18} className="text-amber-400" />
                  </div>
                  <p className="text-white font-medium">Actualiser</p>
                  <p className="text-xs text-gray-500 mt-1">Caisse temps réel</p>
                </button>
              </div>

              {/* Journal transactions */}
              {caisse?.transactions?.length > 0 && (
                <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#2e3a50]">
                    <h2 className="text-sm font-semibold text-white">
                      Journal des transactions
                    </h2>
                  </div>
                  <div className="grid grid-cols-5 gap-3 px-5 py-2 bg-[#1e2535] text-xs text-gray-500 font-mono uppercase tracking-wider">
                    <div className="col-span-2">Type</div>
                    <div>Membre</div>
                    <div>Montant</div>
                    <div>Hash</div>
                  </div>
                  {caisse.transactions.map(tx => (
                    <div key={tx.id}
                      className="grid grid-cols-5 gap-3 px-5 py-3 border-b border-[#2e3a50] last:border-0 items-center text-sm hover:bg-[#1e2535]/50 transition">
                      <div className="col-span-2 flex items-center gap-2">
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          tx.sens==='credit'?'bg-green-900/40 text-green-400':'bg-red-900/40 text-red-400'}`}>
                          {tx.sens==='credit'?'+':'-'}
                        </span>
                        <span className="text-gray-300">{tx.type_transaction}</span>
                      </div>
                      <div className="text-gray-400 text-xs truncate">{tx.membre_nom}</div>
                      <div className={`font-mono font-bold ${
                        tx.sens==='credit'?'text-green-400':'text-red-400'}`}>
                        {parseFloat(tx.montant).toLocaleString('fr-FR')} F
                      </div>
                      <div className="text-gray-600 font-mono text-xs truncate">
                        {tx.signature_hash?.slice(0,8)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── HISTORIQUE ── */}
      {tab === 'historique' && (
        <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2e3a50] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Séances clôturées ({historiqueData?.total || 0})
            </h2>
            <span className="text-xs text-gray-500 font-mono">
              Page {page} / {historiqueData?.pages || 1}
            </span>
          </div>

          {historiqueData?.seances?.length === 0 && (
            <p className="text-center text-gray-500 py-10">
              Aucune séance clôturée pour l'instant
            </p>
          )}

          {historiqueData?.seances?.map(s => (
  <div key={s.id}
    className="flex items-center gap-4 px-5 py-4 border-b border-[#2e3a50] last:border-0 hover:bg-[#1e2535]/50 transition">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink:0 ${
      s.statut === 'ouverte'
        ? 'bg-green-900/30'
        : 'bg-blue-900/30'}`}>
      <span className={`font-mono font-bold text-sm ${
        s.statut === 'ouverte' ? 'text-green-400' : 'text-blue-400'}`}>
        #{s.numero}
      </span>
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-1">
        <p className="text-white font-medium text-sm">
          Séance du {new Date(s.date_seance).toLocaleDateString('fr-FR', {
            weekday:'long', day:'numeric',
            month:'long', year:'numeric'
          })}
        </p>
        {/* Statut */}
        <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${
          s.statut === 'ouverte'
            ? 'bg-green-900/40 text-green-400 animate-pulse'
            : s.ecart === '0.00'
              ? 'bg-blue-900/40 text-blue-400'
              : 'bg-red-900/40 text-red-400'}`}>
          {s.statut === 'ouverte'
            ? '🟢 En cours'
            : s.ecart === '0.00' ? '✅ Parfaite' : '⚠️ Écart'}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>👥 {s.nb_presents} présents</span>
        <span>💰 {parseFloat(s.total_entrees || 0)
          .toLocaleString('fr-FR')} F collectés</span>
        {s.president_seance_nom && (
          <span>🎙️ {s.president_seance_nom}</span>
        )}
      </div>
    </div>
    <div className="flex gap-2">
      {/* Bouton reprendre si séance ouverte */}
      {s.statut === 'ouverte' && (
        <button
          onClick={async () => {
            await refreshCaisse(s.id);
            setTab('seance');
            toast.success(`Séance #${s.numero} reprise !`);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
        >
          <Play size={12} /> Reprendre
        </button>
      )}
      <button
        onClick={() => setShowDetailSeance(s.id)}
        className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition text-sm"
      >
        <Eye size={16} /> Voir détail
      </button>
    </div>
  </div>
))}

          {/* Pagination */}
          {historiqueData?.pages > 1 && (
            <div className="flex items-center justify-center gap-3 px-5 py-4 border-t border-[#2e3a50]">
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-gray-400 hover:text-white disabled:opacity-30 transition text-sm"
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              <span className="text-xs text-gray-500 font-mono">
                {page} / {historiqueData.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(historiqueData.pages, p+1))}
                disabled={page === historiqueData.pages}
                className="flex items-center gap-1 text-gray-400 hover:text-white disabled:opacity-30 transition text-sm"
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Détail séance historique */}
      {showDetailSeance && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Détail de la séance</h2>
              <button onClick={() => setShowDetailSeance(null)}
                className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <BilanContent seanceId={showDetailSeance} />
          </div>
        </div>
      )}

      {/* Modals */}
      {showOuverture && (
        <OuvertureModal
          membres={membres}
          seancePrecedente={null}
          onClose={() => setShowOuverture(false)}
          onOuvrir={handleOuvrir}
        />
      )}

      {showPointage && <PointageModal />}

      {showCotisation && activeSeance && (
        <CotisationModal
          seanceId={activeSeance.id}
          tontines={tontines}
          onClose={() => setShowCotisation(false)}
          onDone={() => refreshCaisse(activeSeance.id)}
        />
      )}

      {showBilan && activeSeance && (
        <BilanModal
          seanceId={activeSeance.id}
          onClose={() => setShowBilan(false)}
          onCloturer={() => { setShowBilan(false); setShowCloture(true); }}
        />
      )}

      {showCloture && activeSeance && (
        <CloturModal
          seance={activeSeance}
          caisse={caisse}
          onClose={() => setShowCloture(false)}
          onDone={() => {
            setActiveSeance(null);
            setCaisse(null);
            refetchHistorique();
          }}
        />
      )}
    </div>
  );
}

// Composant bilan pour le détail historique
function BilanContent({ seanceId }) {
  const { data: bilan, isLoading } = useQuery({
    queryKey: ['bilan', seanceId],
    queryFn: () => getBilan(seanceId)
  });

  if (isLoading) return <p className="text-gray-500 text-center py-8">Chargement...</p>;

  return (
    <div>
      <div className="bg-[#1e2535] rounded-xl p-4 mb-3">
        <p className="text-xs text-gray-500 font-mono uppercase mb-3">Présences</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-bold text-green-400">{bilan?.presences?.presents || 0}</p>
            <p className="text-xs text-gray-500">Présents</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-400">{bilan?.presences?.absents || 0}</p>
            <p className="text-xs text-gray-500">Absents</p>
          </div>
          <div>
            <p className="text-xl font-bold text-amber-400">{bilan?.presences?.excuses || 0}</p>
            <p className="text-xs text-gray-500">Excusés</p>
          </div>
        </div>
      </div>

      {bilan?.cotisations?.map((c, i) => (
        <div key={i} className="bg-[#1e2535] rounded-xl p-4 mb-3">
          <p className="text-xs text-gray-500 font-mono uppercase mb-2">{c.tontine_nom}</p>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded">
                ✅ {c.nb_cotises}
              </span>
              <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">
                ❌ {c.nb_non_cotises}
              </span>
            </div>
            <span className="text-green-400 font-mono font-bold">
              {parseFloat(c.total_cotise).toLocaleString('fr-FR')} F
            </span>
          </div>
        </div>
      ))}

      <div className="bg-[#1e2535] rounded-xl p-4 mb-3">
        <p className="text-xs text-gray-500 font-mono uppercase mb-3">Mouvements</p>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">Entrées</span>
          <span className="text-green-400 font-mono">
            +{parseFloat(bilan?.mouvements?.total_entrees || 0).toLocaleString('fr-FR')} F
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-400">Sorties</span>
          <span className="text-red-400 font-mono">
            -{parseFloat(bilan?.mouvements?.total_sorties || 0).toLocaleString('fr-FR')} F
          </span>
        </div>
      </div>

      <div className={`rounded-xl p-4 ${
        bilan?.seance?.ecart === '0.00'
          ? 'bg-green-900/20 border border-green-800/30'
          : 'bg-red-900/20 border border-red-800/30'}`}>
        <div className="flex justify-between">
          <span className="text-sm text-gray-400">Caisse clôturée</span>
          <span className="text-white font-mono font-bold">
            {parseFloat(bilan?.seance?.caisse_theorique || 0).toLocaleString('fr-FR')} F
          </span>
        </div>
        <p className={`text-xs mt-1 ${
          bilan?.seance?.ecart === '0.00' ? 'text-green-400' : 'text-red-400'}`}>
          {bilan?.seance?.ecart === '0.00' ? '✅ Caisse parfaite' : '⚠️ Écart détecté'}
        </p>
      </div>
    </div>
  );
}