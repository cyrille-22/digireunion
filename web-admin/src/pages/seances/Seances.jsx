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
// API Épargne et Prêts
const getRubriques = () =>
  api.get('/pret-rubriques').then(r => r.data);
const cotiserEpargne = (data) =>
  api.post('/epargne', data);
const getPrets = (statut) =>
  api.get(`/prets${statut ? `?statut=${statut}` : ''}`).then(r => r.data);
const validerPret = (id, data) =>
  api.put(`/prets/${id}/valider`, data);
const rembourserPret = (data) =>
  api.post('/prets/rembourser', data);
const getPretsMembre = (id) =>
  api.get(`/prets/membre/${id}`).then(r => r.data);
// API Bouffer
const preparerBouffer = (seanceId, tontineId, memberId) =>
  api.get(`/bouffer/preparer/${seanceId}/${tontineId}/${memberId}`)
    .then(r => r.data);
const confirmerBouffer = (data) =>
  api.post('/bouffer/confirmer', data);
const getDeductions = () =>
  api.get('/deductions').then(r => r.data);

// API Nouvelles, Ordre du jour, Divers
const getNouvellesSeance = (id) =>
  api.get(`/seances/nouvelles/${id}`).then(r => r.data);
const ajouterNouvelle = (data) =>
  api.post('/seances/nouvelles', data);
const supprimerNouvelle = (id) =>
  api.delete(`/seances/nouvelles/${id}`);
const getOrdreJour = (id) =>
  api.get(`/seances/ordre-du-jour/${id}`).then(r => r.data);
const ajouterPoint = (data) =>
  api.post('/seances/ordre-du-jour', data);
const updatePoint = (id, data) =>
  api.put(`/seances/ordre-du-jour/${id}`, data);
const supprimerPoint = (id) =>
  api.delete(`/seances/ordre-du-jour/${id}`);
const ajouterDivers = (data) =>
  api.post('/seances/divers', data);
const getDivers = (id) =>
  api.get(`/seances/divers/${id}`).then(r => r.data);

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

// ── MODAL RUBRIQUES FINANCIÈRES ───────────────────────────────
function RubriquesModal({ seanceId, membres, onClose, onDone }) {
  const [tab, setTab]                     = useState('banque');
  const [selectedMembre, setSelectedMembre] = useState('');
  const [selectedRubrique, setSelectedRubrique] = useState('');
  const [montant, setMontant]             = useState('');
  const [motif, setMotif]                 = useState('');
  const [nbEcheances, setNbEcheances]     = useState(1);
  const [loading, setLoading]             = useState(false);
  const [pretsMembre, setPretsMembre]     = useState([]);
  const [selectedPret, setSelectedPret]   = useState('');
  const [typePret, setTypePret]           = useState('nouveau');

  const { data: rubriquesData } = useQuery({
    queryKey: ['rubriques'],
    queryFn: () => api.get('/pret-rubriques').then(r => r.data)
  });

  const { data: pretsData, refetch: refetchPrets } = useQuery({
    queryKey: ['prets'],
    queryFn: () => getPrets()
  });

  const rubriques = rubriquesData?.rubriques || [];
  const prets     = pretsData?.prets         || [];

  // Rubriques par type
  const rubriquesEpargne = rubriques.filter(r =>
    ['epargne', 'fond'].includes(r.type_rubrique)
  );
  const rubriquesPret = rubriques.filter(r =>
    r.type_rubrique === 'pret'
  );

  const pretsEnAttente = prets.filter(p => p.statut === 'en_attente');
  const pretsEnCours   = prets.filter(p => p.statut === 'en_cours');

  // Charger les prêts d'un membre
  const loadPretsMembre = async (memberId) => {
    if (!memberId) return;
    try {
      const data = await getPretsMembre(memberId);
      setPretsMembre(data.prets || []);
    } catch {
      setPretsMembre([]);
    }
  };

  // ── COTISATION ÉPARGNE/BANQUE ─────────────────────────────
  const handleEpargne = async (e) => {
    e.preventDefault();
    if (!selectedMembre || !selectedRubrique || !montant) {
      toast.error('Remplissez tous les champs');
      return;
    }
    setLoading(true);
    try {
      await cotiserEpargne({
        member_id:   selectedMembre,
        rubrique_id: selectedRubrique,
        montant:     parseFloat(montant),
        seance_id:   seanceId
      });
      const rb = rubriquesEpargne.find(r => r.id === selectedRubrique);
      toast.success(`✅ Épargne ${rb?.nom} enregistrée !`);
      setMontant('');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  // ── ATTRIBUER UN PRÊT ────────────────────────────────────
  const handleAttribuerPret = async (e) => {
    e.preventDefault();
    if (!selectedMembre || !selectedRubrique || !montant) {
      toast.error('Remplissez tous les champs');
      return;
    }
    setLoading(true);
    try {
      // Trouver la rubrique
      const rb = rubriquesPret.find(r => r.id === selectedRubrique);

      // Calculer les intérêts
      const tauxInteret  = parseFloat(rb?.taux_interet || 0);
      const nb           = parseInt(nbEcheances || 1);
      let montantInteret = 0;

      if (rb?.mode_calcul_interet === 'simple') {
        montantInteret = parseFloat(montant) * tauxInteret * nb;
      } else if (rb?.mode_calcul_interet === 'forfait') {
        montantInteret = tauxInteret;
      } else if (rb?.mode_calcul_interet === 'degressif') {
        montantInteret = parseFloat(montant) * tauxInteret;
      }

      const montantTotal = parseFloat(montant) + montantInteret;

      // Créer et approuver directement le prêt
      const res = await api.post('/prets', {
        rubrique_id:  selectedRubrique,
        montant:      parseFloat(montant),
        nb_echeances: nb,
        motif,
        member_id:    selectedMembre
      });

      // Si en attente — approuver directement
      if (res.data.pret?.statut === 'en_attente') {
        await validerPret(res.data.pret.id, {
          decision:  'approuve',
          seance_id: seanceId
        });
      }

      toast.success(
        `✅ Prêt de ${parseFloat(montant).toLocaleString('fr-FR')} F` +
        ` attribué à ${membres.find(m => m.id === selectedMembre)?.nom_complet}` +
        ` — Total dû : ${montantTotal.toLocaleString('fr-FR')} F`
      );
      setMontant('');
      setMotif('');
      setNbEcheances(1);
      refetchPrets();
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  // ── APPROBATION PRÊT ─────────────────────────────────────
  const handleValiderPret = async (pretId, decision) => {
    setLoading(true);
    try {
      await validerPret(pretId, { decision, seance_id: seanceId });
      toast.success(decision === 'approuve'
        ? '✅ Prêt approuvé et décaissé !'
        : '❌ Prêt rejeté');
      refetchPrets();
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  // ── REMBOURSEMENT ────────────────────────────────────────
    const handleRemboursement = async (e) => {
  e.preventDefault();
  if (!selectedPret || !montant) {
    toast.error('Sélectionnez un prêt et entrez le montant');
    return;
  }
  setLoading(true);
  try {
    const res = await rembourserPret({
      pret_id:   selectedPret,
      montant:   parseFloat(montant),
      seance_id: seanceId
    });
    toast.success(res.data.message);
    setMontant('');
    setSelectedPret('');
    setPretsMembre([]);
    setSelectedMembre('');

    // ── NOUVEAU : recharger les prêts du membre ──
    // pour mettre à jour le statut
    refetchPrets();


    {pretsMembre
  .filter(p => p.statut === 'en_cours') // ← Afficher seulement les prêts en cours
  .map(p => (
    <div key={p.id}
      onClick={() => {
        setSelectedPret(p.id);
        setMontant(
          (parseFloat(p.montant_total_du) /
          parseFloat(p.nb_echeances)).toFixed(0)
        );
      }}
      className={`border rounded-xl p-3 mb-2 cursor-pointer
        transition ${selectedPret === p.id
          ? 'bg-blue-900/20 border-blue-800/50'
          : 'bg-[#1e2535] border-[#2e3a50]'}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-white text-sm font-medium">
            {p.rubrique_nom}
          </p>
          <p className="text-xs text-gray-500">
            Échéance suggérée :
            {(parseFloat(p.montant_total_du) /
              parseFloat(p.nb_echeances))
              .toLocaleString('fr-FR')} F
          </p>
        </div>
        <div className="text-right">
          <p className="text-red-400 font-mono font-bold text-sm">
            {parseFloat(p.reste_a_regler)
              .toLocaleString('fr-FR')} F
          </p>
          <p className="text-xs text-gray-500">Reste à régler</p>
        </div>
      </div>
    </div>
  ))
}

{/* Message si aucun prêt en cours */}
{pretsMembre.filter(p => p.statut === 'en_cours').length === 0
  && selectedMembre && (
  <div className="bg-green-900/20 border border-green-800/30
    rounded-xl p-4 text-center">
    <p className="text-green-400 text-sm">
      ✅ Ce membre n'a aucun prêt en cours
    </p>
  </div>
)}
    // Si prêt soldé — retirer de la liste
    if (res.data.statut_pret === 'solde') {
      toast.success('🎉 Prêt entièrement soldé !');
    }

    onDone();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur');
  } finally {
    setLoading(false);
  }
};

  // ── GAV ──────────────────────────────────────────────────
  const handleGAV = async (type) => {
    if (!selectedMembre || !montant) {
      toast.error('Sélectionnez un membre et entrez le montant');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/seances/${seanceId}/transactions`, {
        member_id:        selectedMembre,
        type_transaction: type === 'depot' ? 'gav_depot' : 'gav_retrait',
        montant:          parseFloat(montant),
        sens:             type === 'depot' ? 'credit' : 'debit'
      });
      toast.success(type === 'depot'
        ? '✅ Dépôt GAV enregistré !'
        : '✅ Retrait GAV enregistré !');
      setMontant('');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  // Rubrique sélectionnée pour afficher les détails
  const rubriqueSelectionnee = rubriquesPret.find(r =>
    r.id === selectedRubrique
  );
  const montantInteret = rubriqueSelectionnee && montant
    ? rubriqueSelectionnee.mode_calcul_interet === 'simple'
      ? parseFloat(montant) * parseFloat(rubriqueSelectionnee.taux_interet) * nbEcheances
      : rubriqueSelectionnee.mode_calcul_interet === 'forfait'
        ? parseFloat(rubriqueSelectionnee.taux_interet)
        : parseFloat(montant) * parseFloat(rubriqueSelectionnee.taux_interet)
    : 0;
  const montantTotalDu = parseFloat(montant || 0) + montantInteret;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center
      justify-center z-50">
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl
        p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Rubriques financières
          </h2>
          <button onClick={onClose}
            className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1e2535] p-1 rounded-xl mb-4
          overflow-x-auto">
          {[
            ['banque',        '🏦 Banque'],
            ['pret',          '💳 Attribuer prêt'],
            ['approbation',   '📋 Approbations'],
            ['remboursement', '↩️ Remboursement'],
            ['gav',           '💰 GAV'],
          ].map(([key, label]) => (
            <button key={key}
              onClick={() => {
                setTab(key);
                setMontant('');
                setSelectedMembre('');
                setSelectedRubrique('');
              }}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs
                font-medium transition ${tab === key
                  ? 'bg-[#161b27] text-white shadow'
                  : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── BANQUE / ÉPARGNE ── */}
          {tab === 'banque' && (
            <form onSubmit={handleEpargne} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Membre
                </label>
                <select value={selectedMembre}
                  onChange={e => setSelectedMembre(e.target.value)}
                  className="w-full bg-[#1e2535] border border-[#2e3a50]
                    rounded-xl px-4 py-3 text-white focus:outline-none
                    focus:border-blue-500"
                  required>
                  <option value="">Sélectionner un membre</option>
                  {membres.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nom_complet} — {m.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Rubrique d'épargne
                </label>
                {rubriquesEpargne.length === 0 ? (
                  <div className="bg-amber-900/20 border border-amber-800/30
                    rounded-xl p-4 text-center">
                    <p className="text-amber-400 text-sm">
                      ⚠️ Aucune rubrique d'épargne configurée.
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Allez dans Configuration → Rubriques pour en créer.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rubriquesEpargne.map(r => (
                      <div key={r.id}
                        onClick={() => setSelectedRubrique(r.id)}
                        className={`border rounded-xl p-3 cursor-pointer transition ${selectedRubrique === r.id
                            ? 'bg-blue-900/20 border-blue-800/50'
                            : 'bg-[#1e2535] border-[#2e3a50] hover:border-blue-800/30'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white text-sm font-medium">
                              {r.nom}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {r.est_obligatoire
                                ? '🔴 Obligatoire'
                                : '🟢 Facultative'}
                              {r.montant_minimum > 0 &&
                                ` · Min: ${parseFloat(r.montant_minimum)
                                  .toLocaleString('fr-FR')} F`}
                              {r.interet_epargne > 0 &&
                                ` · Intérêt: ${(parseFloat(r.interet_epargne) * 100)
                                  .toFixed(1)}%`}
                            </p>
                          </div>
                          {selectedRubrique === r.id && (
                            <Check size={16} className="text-blue-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedRubrique && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Montant à épargner (FCFA)
                  </label>
                  <input type="number" min="1" value={montant}
                    onChange={e => setMontant(e.target.value)}
                    placeholder="Ex: 10 000"
                    className="w-full bg-[#1e2535] border border-[#2e3a50]
                      rounded-xl px-4 py-3 text-white placeholder-gray-600
                      focus:outline-none focus:border-green-500 font-mono
                      text-lg"
                    required />
                </div>
              )}

              {selectedRubrique && montant && (
                <button type="submit" disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700
                    text-white py-3 rounded-xl font-semibold transition
                    flex items-center justify-center gap-2
                    disabled:opacity-50">
                  <Check size={16} />
                  {loading ? 'Enregistrement...' : 'Enregistrer l\'épargne'}
                </button>
              )}
            </form>
          )}

          {/* ── ATTRIBUER UN PRÊT ── */}
          {tab === 'pret' && (
            <form onSubmit={handleAttribuerPret} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Membre bénéficiaire
                </label>
                <select value={selectedMembre}
                  onChange={e => setSelectedMembre(e.target.value)}
                  className="w-full bg-[#1e2535] border border-[#2e3a50]
                    rounded-xl px-4 py-3 text-white focus:outline-none
                    focus:border-blue-500"
                  required>
                  <option value="">Sélectionner un membre</option>
                  {membres.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nom_complet}
                      {m.statut !== 'actif' ? ' ⚠️ Inactif' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Rubrique de prêt
                </label>
                {rubriquesPret.length === 0 ? (
                  <div className="bg-amber-900/20 border border-amber-800/30
                    rounded-xl p-4 text-center">
                    <p className="text-amber-400 text-sm">
                      ⚠️ Aucune rubrique de prêt configurée.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rubriquesPret.map(r => (
                      <div key={r.id}
                        onClick={() => setSelectedRubrique(r.id)}
                        className={`border rounded-xl p-3 cursor-pointer transition ${selectedRubrique === r.id
                            ? 'bg-blue-900/20 border-blue-800/50'
                            : 'bg-[#1e2535] border-[#2e3a50] hover:border-blue-800/30'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white text-sm font-medium">
                              {r.nom}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Taux : {(parseFloat(r.taux_interet) * 100)
                                .toFixed(1)}%
                              · Mode : {r.mode_calcul_interet}
                              · Max : {r.duree_max_seances} séances
                              {r.plafond && ` · Plafond : ${parseFloat(r.plafond)
                                .toLocaleString('fr-FR')} F`}
                            </p>
                          </div>
                          {selectedRubrique === r.id && (
                            <Check size={16} className="text-blue-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedRubrique && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Montant du prêt (FCFA)
                      </label>
                      <input type="number" min="1" value={montant}
                        onChange={e => setMontant(e.target.value)}
                        placeholder="Ex: 50 000"
                        className="w-full bg-[#1e2535] border border-[#2e3a50]
                          rounded-xl px-4 py-3 text-white placeholder-gray-600
                          focus:outline-none focus:border-blue-500 font-mono"
                        required />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Nombre d'échéances
                      </label>
                      <input type="number" min="1"
                        max={rubriqueSelectionnee?.duree_max_seances || 12}
                        value={nbEcheances}
                        onChange={e => setNbEcheances(e.target.value)}
                        className="w-full bg-[#1e2535] border border-[#2e3a50]
                          rounded-xl px-4 py-3 text-white focus:outline-none
                          focus:border-blue-500 font-mono" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Motif du prêt
                    </label>
                    <textarea value={motif}
                      onChange={e => setMotif(e.target.value)}
                      placeholder="Raison du prêt..."
                      rows={2}
                      className="w-full bg-[#1e2535] border border-[#2e3a50]
                        rounded-xl px-4 py-3 text-white placeholder-gray-600
                        focus:outline-none focus:border-blue-500 resize-none" />
                  </div>

                  {/* Récapitulatif */}
                  {montant && (
                    <div className="bg-[#1e2535] rounded-xl p-4 space-y-2">
                      <p className="text-xs text-gray-500 font-mono
                        uppercase tracking-wider mb-3">
                        Récapitulatif
                      </p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Montant emprunté</span>
                        <span className="text-white font-mono">
                          {parseFloat(montant).toLocaleString('fr-FR')} F
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Intérêts</span>
                        <span className="text-amber-400 font-mono">
                          +{montantInteret.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Échéances</span>
                        <span className="text-white font-mono">
                          {nbEcheances} ×
                          {(montantTotalDu / nbEcheances)
                            .toLocaleString('fr-FR')} F
                        </span>
                      </div>
                      <div className="h-px bg-[#2e3a50] my-2"></div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-white">Total à rembourser</span>
                        <span className="text-red-400 font-mono text-lg">
                          {montantTotalDu.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedMembre && selectedRubrique && montant && (
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white
                    py-3 rounded-xl font-semibold transition
                    flex items-center justify-center gap-2
                    disabled:opacity-50">
                  <Check size={16} />
                  {loading
                    ? 'Attribution...'
                    : `Attribuer le prêt — ${montantTotalDu
                        .toLocaleString('fr-FR')} F`}
                </button>
              )}
            </form>
          )}

          {/* ── APPROBATIONS ── */}
          {tab === 'approbation' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-mono uppercase
                tracking-wider mb-3">
                Demandes en attente ({pretsEnAttente.length})
              </p>

              {pretsEnAttente.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    ✅ Aucune demande en attente
                  </p>
                </div>
              ) : (
                pretsEnAttente.map(p => (
                  <div key={p.id}
                    className="bg-[#1e2535] border border-amber-800/30
                      rounded-xl p-4">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="text-white font-medium text-sm">
                          {p.nom_complet}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.rubrique_nom}
                        </p>
                      </div>
                      <span className="text-amber-400 font-mono font-bold">
                        {parseFloat(p.montant).toLocaleString('fr-FR')} F
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-[#252d40] rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Intérêts</p>
                        <p className="text-white font-mono text-xs">
                          {parseFloat(p.montant_interet)
                            .toLocaleString('fr-FR')} F
                        </p>
                      </div>
                      <div className="bg-[#252d40] rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Total dû</p>
                        <p className="text-amber-400 font-mono text-xs">
                          {parseFloat(p.montant_total_du)
                            .toLocaleString('fr-FR')} F
                        </p>
                      </div>
                      <div className="bg-[#252d40] rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Échéances</p>
                        <p className="text-white font-mono text-xs">
                          {p.nb_echeances}
                        </p>
                      </div>
                    </div>

                    {p.metadata_json?.motif && (
                      <p className="text-xs text-gray-400 italic mb-3">
                        Motif : {p.metadata_json.motif}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleValiderPret(p.id, 'approuve')}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700
                          text-white py-2 rounded-lg text-xs font-medium
                          transition flex items-center justify-center gap-1
                          disabled:opacity-50">
                        <Check size={12} /> Approuver
                      </button>
                      <button
                        onClick={() => handleValiderPret(p.id, 'rejete')}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700
                          text-white py-2 rounded-lg text-xs font-medium
                          transition flex items-center justify-center gap-1
                          disabled:opacity-50">
                        <X size={12} /> Rejeter
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Prêts en cours */}
              {pretsEnCours.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 font-mono uppercase
                    tracking-wider mt-4 mb-2">
                    Prêts en cours ({pretsEnCours.length})
                  </p>
                  {pretsEnCours.map(p => (
                    <div key={p.id}
                      className="bg-[#1e2535] border border-[#2e3a50]
                        rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-medium">
                          {p.nom_complet}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.rubrique_nom}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-400 font-mono text-sm font-bold">
                          {parseFloat(p.reste_a_regler)
                            .toLocaleString('fr-FR')} F
                        </p>
                        <p className="text-xs text-gray-500">
                          Reste à régler
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── REMBOURSEMENT ── */}
          {tab === 'remboursement' && (
            <form onSubmit={handleRemboursement} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Membre
                </label>
                <select value={selectedMembre}
                  onChange={e => {
                    setSelectedMembre(e.target.value);
                    loadPretsMembre(e.target.value);
                    setSelectedPret('');
                    setMontant('');
                  }}
                  className="w-full bg-[#1e2535] border border-[#2e3a50]
                    rounded-xl px-4 py-3 text-white focus:outline-none
                    focus:border-blue-500"
                  required>
                  <option value="">Sélectionner un membre</option>
                  {membres.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nom_complet}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMembre && pretsMembre.length === 0 && (
                <div className="bg-green-900/20 border border-green-800/30
                  rounded-xl p-4 text-center">
                  <p className="text-green-400 text-sm">
                    ✅ Ce membre n'a aucun prêt en cours
                  </p>
                </div>
              )}

              {pretsMembre.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Prêt à rembourser
                  </label>
                  {pretsMembre.map(p => (
                    <div key={p.id}
                      onClick={() => {
                        setSelectedPret(p.id);
                        setMontant(
                          (parseFloat(p.montant_total_du) /
                          parseFloat(p.nb_echeances)).toFixed(0)
                        );
                      }}
                      className={`border rounded-xl p-3 mb-2 cursor-pointer
                        transition ${selectedPret === p.id
                          ? 'bg-blue-900/20 border-blue-800/50'
                          : 'bg-[#1e2535] border-[#2e3a50]'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white text-sm font-medium">
                            {p.rubrique_nom}
                          </p>
                          <p className="text-xs text-gray-500">
                            Échéance suggérée :
                            {(parseFloat(p.montant_total_du) /
                              parseFloat(p.nb_echeances))
                              .toLocaleString('fr-FR')} F
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-400 font-mono font-bold text-sm">
                            {parseFloat(p.reste_a_regler)
                              .toLocaleString('fr-FR')} F
                          </p>
                          <p className="text-xs text-gray-500">
                            Reste à régler
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPret && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Montant du remboursement (FCFA)
                  </label>
                  <input type="number" min="1" value={montant}
                    onChange={e => setMontant(e.target.value)}
                    className="w-full bg-[#1e2535] border border-[#2e3a50]
                      rounded-xl px-4 py-3 text-white focus:outline-none
                      focus:border-blue-500 font-mono text-lg"
                    required />
                  <p className="text-xs text-gray-500 mt-1">
                    Le montant suggéré correspond à une échéance normale
                  </p>
                </div>
              )}

              {selectedPret && montant && (
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white
                    py-3 rounded-xl font-semibold transition
                    flex items-center justify-center gap-2
                    disabled:opacity-50">
                  <Check size={16} />
                  {loading
                    ? 'Enregistrement...'
                    : `Valider — ${parseFloat(montant)
                        .toLocaleString('fr-FR')} F`}
                </button>
              )}
            </form>
          )}

          {/* ── GAV ── */}
          {tab === 'gav' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Membre
                </label>
                <select value={selectedMembre}
                  onChange={e => setSelectedMembre(e.target.value)}
                  className="w-full bg-[#1e2535] border border-[#2e3a50]
                    rounded-xl px-4 py-3 text-white focus:outline-none
                    focus:border-blue-500">
                  <option value="">Sélectionner un membre</option>
                  {membres.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nom_complet} — GAV :
                      {parseFloat(m.gav_solde || 0)
                        .toLocaleString('fr-FR')} F
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Montant (FCFA)
                </label>
                <input type="number" min="1" value={montant}
                  onChange={e => setMontant(e.target.value)}
                  placeholder="Montant"
                  className="w-full bg-[#1e2535] border border-[#2e3a50]
                    rounded-xl px-4 py-3 text-white placeholder-gray-600
                    focus:outline-none focus:border-blue-500 font-mono
                    text-lg" />
              </div>

              {selectedMembre && montant && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleGAV('depot')}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white
                      py-3 rounded-xl font-semibold transition
                      flex items-center justify-center gap-2
                      disabled:opacity-50">
                    <Check size={16} />
                    Dépôt GAV
                  </button>
                  <button
                    onClick={() => handleGAV('retrait')}
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-700 text-white
                      py-3 rounded-xl font-semibold transition
                      flex items-center justify-center gap-2
                      disabled:opacity-50">
                    <X size={16} />
                    Retrait GAV
                  </button>
                </div>
              )}

              <div className="bg-[#1e2535] rounded-xl p-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  💡 La Garde à Vue est une épargne liquide personnelle.
                  Elle peut couvrir automatiquement les cotisations
                  futures du membre.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MODAL BOUFFER ─────────────────────────────────────────────
function BoufferModal({ seanceId, membres, tontines, onClose, onDone }) {
  const [step, setStep]                 = useState(1);
  const [selectedTontine, setSelectedTontine] = useState(null);
  const [selectedMembres, setSelectedMembres] = useState([]);
  const [currentMembreIndex, setCurrentMembreIndex] = useState(0);
  const [boufferData, setBoufferData]   = useState(null);
  const [loading, setLoading]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  // Déductions sélectionnées pour chaque membre
  const [deductionsSelectionnees, setDeductionsSelectionnees] = useState([]);
  const [pretsADeduire, setPretsADeduire] = useState([]);

  // Résultats finaux
  const [resultats, setResultats] = useState([]);

  // Charger les données du bouffer pour un membre
  const loadBouffer = async (tontineId, memberId) => {
    setLoading(true);
    try {
      const data = await preparerBouffer(seanceId, tontineId, memberId);
      setBoufferData(data);
      // Initialiser les déductions
      setDeductionsSelectionnees(data.deductions.map(d => ({
        ...d,
        selectionne: d.obligatoire
      })));
      // Initialiser les prêts
      setPretsADeduire(data.prets_en_cours.map(p => ({
        ...p,
        selectionne: false,
        montant_deduit: parseFloat(p.reste_a_regler)
      })));
    } catch (err) {
      toast.error('Erreur chargement données bouffer');
    } finally {
      setLoading(false);
    }
  };

  // Calculer le montant net
  const totalDeductions = deductionsSelectionnees
    .filter(d => d.selectionne)
    .reduce((s, d) => s + parseFloat(d.montant || 0), 0);

  const totalPrets = pretsADeduire
    .filter(p => p.selectionne)
    .reduce((s, p) => s + parseFloat(p.montant_deduit || 0), 0);

  const montantNet = boufferData
    ? parseFloat(boufferData.montant_brut) - totalDeductions - totalPrets
    : 0;

  // Confirmer le bouffer pour le membre courant
  const handleConfirmerMembre = async () => {
    setSubmitting(true);
    try {
      const res = await confirmerBouffer({
        member_id:    selectedMembres[currentMembreIndex].id,
        tontine_id:   selectedTontine.id,
        seance_id:    seanceId,
        montant_brut: boufferData.montant_brut,
        deductions_selectionnees: deductionsSelectionnees
          .filter(d => d.selectionne)
          .map(d => ({ id: d.id, nom: d.nom, montant: d.montant })),
        prets_a_deduire: pretsADeduire
          .filter(p => p.selectionne)
          .map(p => ({
            pret_id:      p.id,
            montant_deduit: p.montant_deduit,
            rubrique_nom: p.rubrique_nom
          }))
      });

      // Sauvegarder le résultat
      setResultats(prev => [...prev, {
        membre: selectedMembres[currentMembreIndex],
        ...res.data.resume
      }]);

      toast.success(
        `✅ ${selectedMembres[currentMembreIndex].nom_complet} — ` +
        `${montantNet.toLocaleString('fr-FR')} F versé !`
      );

      // Passer au membre suivant ou terminer
      if (currentMembreIndex < selectedMembres.length - 1) {
        setCurrentMembreIndex(prev => prev + 1);
        await loadBouffer(
          selectedTontine.id,
          selectedMembres[currentMembreIndex + 1].id
        );
      } else {
        setStep(4); // Écran de résumé final
        onDone();
      }

    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center
      justify-center z-50">
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl
        p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              🎉 Bénéfice — Bouffer
            </h2>
            {selectedTontine && (
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedTontine.nom}
                {boufferData && (
                  <span className="text-blue-400 ml-2">
                    · {boufferData.tontine.evolution}
                  </span>
                )}
              </p>
            )}
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center gap-2 mb-5">
          {[
            '1. Tontine',
            '2. Bénéficiaires',
            '3. Calcul',
            '4. Résumé'
          ].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-1.5 flex-1`}>
                <div className={`w-6 h-6 rounded-full flex items-center
                  justify-center text-xs font-bold flex-shrink-0 ${
                  step > i + 1
                    ? 'bg-green-500 text-white'
                    : step === i + 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#252d40] text-gray-500'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${
                  step === i + 1 ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
              {i < 3 && (
                <div className={`h-px flex-1 ${
                  step > i + 1
                    ? 'bg-green-500'
                    : 'bg-[#252d40]'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── ÉTAPE 1 : Choisir la tontine ── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-4">
                Sélectionnez la tontine pour laquelle vous allez
                désigner un bénéficiaire :
              </p>
              {tontines.map(t => (
                <div key={t.id}
                  onClick={() => {
                    setSelectedTontine(t);
                    setStep(2);
                  }}
                  className="bg-[#1e2535] border border-[#2e3a50]
                    hover:border-blue-800/50 rounded-xl p-4
                    cursor-pointer transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{t.nom}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {parseFloat(t.montant_part)
                          .toLocaleString('fr-FR')} F/part
                        · {t.mode_attribution === 'tour_role'
                          ? 'Tour de rôle'
                          : t.mode_attribution === 'tirage'
                            ? 'Tirage au sort'
                            : 'Enchères'}
                        · Cycle : {t.nb_seances_cycle || 52} séances
                      </p>
                      <p className="text-xs text-blue-400 mt-1">
                        Séance {t.seance_courante || 0} /
                        {t.nb_seances_cycle || 52} du cycle
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ÉTAPE 2 : Choisir les bénéficiaires ── */}
          {step === 2 && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                Sélectionnez le ou les membres qui vont bouffer
                cette séance :
              </p>

              <div className="space-y-2 mb-4">
                {membres.map(m => {
                  const estSelectionne = selectedMembres
                    .some(sm => sm.id === m.id);
                  return (
                    <div key={m.id}
                      onClick={() => {
                        if (estSelectionne) {
                          setSelectedMembres(prev =>
                            prev.filter(sm => sm.id !== m.id));
                        } else {
                          setSelectedMembres(prev => [...prev, m]);
                        }
                      }}
                      className={`flex items-center gap-3 rounded-xl
                        px-4 py-3 cursor-pointer transition border ${
                        estSelectionne
                          ? 'bg-green-900/20 border-green-800/30'
                          : 'bg-[#1e2535] border-transparent'}`}>
                      <div className={`w-6 h-6 rounded-lg border-2
                        flex items-center justify-center flex-shrink-0
                        transition ${estSelectionne
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-600'}`}>
                        {estSelectionne && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      <div className="w-9 h-9 rounded-full
                        bg-blue-900/40 text-blue-400 flex items-center
                        justify-center text-xs font-bold flex-shrink-0">
                        {m.nom_complet.split(' ')
                          .map(n => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${
                          estSelectionne
                            ? 'text-green-400' : 'text-white'}`}>
                          {m.nom_complet}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {m.role}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-2 bg-[#1e2535]
                    border border-[#2e3a50] text-gray-400 px-4 py-3
                    rounded-xl hover:text-white transition">
                  <ChevronLeft size={16} /> Retour
                </button>
                <button
                  onClick={async () => {
                    if (selectedMembres.length === 0) {
                      toast.error('Sélectionnez au moins un membre');
                      return;
                    }
                    setCurrentMembreIndex(0);
                    await loadBouffer(
                      selectedTontine.id,
                      selectedMembres[0].id
                    );
                    setStep(3);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700
                    text-white py-3 rounded-xl font-semibold transition
                    flex items-center justify-center gap-2">
                  Continuer ({selectedMembres.length} sélectionné(s))
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Calcul du bénéfice ── */}
          {step === 3 && (
            <div>
              {loading ? (
                <div className="text-center py-10">
                  <p className="text-gray-400">
                    Chargement des données...
                  </p>
                </div>
              ) : boufferData && (
                <>
                  {/* Info membre courant */}
                  <div className="bg-[#1e2535] rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full
                        bg-green-900/40 text-green-400 flex items-center
                        justify-center text-sm font-bold">
                        {boufferData.membre.nom_complet.split(' ')
                          .map(n => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {boufferData.membre.nom_complet}
                        </p>
                        <p className="text-xs text-gray-500">
                          Bénéficiaire {currentMembreIndex + 1} /
                          {selectedMembres.length}
                          · {boufferData.nb_parts} part(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Montant brut */}
                  <div className="bg-green-900/20 border
                    border-green-800/30 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-400">
                        Montant brut {selectedTontine.nom}
                      </p>
                      <p className="text-xl font-bold text-green-400
                        font-mono">
                        {parseFloat(boufferData.montant_brut)
                          .toLocaleString('fr-FR')} F
                      </p>
                    </div>
                  </div>

                  {/* Déductions configurées */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 font-mono
                      uppercase tracking-wider mb-2">
                      Déductions configurées
                    </p>
                    <div className="space-y-2">
                      {deductionsSelectionnees.map((d, i) => (
                        <div key={d.id}
                          onClick={() => {
                            if (d.obligatoire) return;
                            setDeductionsSelectionnees(prev =>
                              prev.map((dd, ii) =>
                                ii === i
                                  ? { ...dd, selectionne: !dd.selectionne }
                                  : dd
                              )
                            );
                          }}
                          className={`flex items-center gap-3 rounded-xl
                            px-4 py-3 transition border ${
                            d.obligatoire
                              ? 'bg-[#1e2535] border-[#2e3a50] opacity-75'
                              : d.selectionne
                                ? 'bg-red-900/20 border-red-800/30 cursor-pointer'
                                : 'bg-[#1e2535] border-transparent cursor-pointer'}`}>
                          <div className={`w-5 h-5 rounded border-2
                            flex items-center justify-center flex-shrink-0 ${
                            d.selectionne
                              ? 'bg-red-500 border-red-500'
                              : 'border-gray-600'}`}>
                            {d.selectionne && (
                              <Check size={12} className="text-white" />
                            )}
                          </div>
                          <span className="flex-1 text-sm text-white">
                            {d.nom}
                            {d.obligatoire && (
                              <span className="text-xs text-gray-500
                                ml-1">(obligatoire)</span>
                            )}
                          </span>
                          <span className={`font-mono text-sm ${
                            d.selectionne
                              ? 'text-red-400' : 'text-gray-500'}`}>
                            -{parseFloat(d.montant)
                              .toLocaleString('fr-FR')} F
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prêts en cours */}
                  {boufferData.prets_en_cours.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 font-mono
                        uppercase tracking-wider mb-2">
                        Prêts en cours — Déduire ?
                      </p>
                      <div className="space-y-2">
                        {pretsADeduire.map((p, i) => (
                          <div key={p.id}
                            className={`rounded-xl border transition ${
                              p.selectionne
                                ? 'bg-amber-900/20 border-amber-800/30'
                                : 'bg-[#1e2535] border-[#2e3a50]'}`}>
                            <div
                              onClick={() => {
                                setPretsADeduire(prev =>
                                  prev.map((pp, ii) =>
                                    ii === i
                                      ? { ...pp, selectionne: !pp.selectionne }
                                      : pp
                                  )
                                );
                              }}
                              className="flex items-center gap-3
                                px-4 py-3 cursor-pointer">
                              <div className={`w-5 h-5 rounded border-2
                                flex items-center justify-center
                                flex-shrink-0 ${p.selectionne
                                  ? 'bg-amber-500 border-amber-500'
                                  : 'border-gray-600'}`}>
                                {p.selectionne && (
                                  <Check size={12} className="text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-white">
                                  {p.rubrique_nom}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Reste à régler :
                                  {parseFloat(p.reste_a_regler)
                                    .toLocaleString('fr-FR')} F
                                </p>
                              </div>
                              <span className={`font-mono text-sm ${
                                p.selectionne
                                  ? 'text-amber-400' : 'text-gray-500'}`}>
                                -{parseFloat(p.montant_deduit)
                                  .toLocaleString('fr-FR')} F
                              </span>
                            </div>
                            {/* Modifier le montant à déduire */}
                            {p.selectionne && (
                              <div className="px-4 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    Montant à déduire :
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={parseFloat(p.reste_a_regler)}
                                    value={p.montant_deduit}
                                    onChange={e => {
                                      setPretsADeduire(prev =>
                                        prev.map((pp, ii) =>
                                          ii === i
                                            ? { ...pp, montant_deduit: e.target.value }
                                            : pp
                                        )
                                      );
                                    }}
                                    className="flex-1 bg-[#252d40] border
                                      border-[#3a4960] rounded-lg px-3 py-1.5
                                      text-white text-sm font-mono
                                      focus:outline-none focus:border-amber-500"
                                  />
                                  <span className="text-xs text-gray-500">
                                    FCFA
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Récapitulatif net */}
                  <div className={`rounded-xl p-4 mb-4 border ${
                    montantNet >= 0
                      ? 'bg-blue-900/20 border-blue-800/30'
                      : 'bg-red-900/20 border-red-800/30'}`}>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Montant brut</span>
                        <span className="text-green-400 font-mono">
                          {parseFloat(boufferData.montant_brut)
                            .toLocaleString('fr-FR')} F
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          Total déductions
                        </span>
                        <span className="text-red-400 font-mono">
                          -{totalDeductions.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                      {totalPrets > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">
                            Total prêts déduits
                          </span>
                          <span className="text-amber-400 font-mono">
                            -{totalPrets.toLocaleString('fr-FR')} F
                          </span>
                        </div>
                      )}
                      <div className="h-px bg-[#2e3a50]"></div>
                      <div className="flex justify-between font-bold">
                        <span className="text-white text-base">
                          NET À PERCEVOIR
                        </span>
                        <span className={`font-mono text-xl ${
                          montantNet >= 0
                            ? 'text-blue-400' : 'text-red-400'}`}>
                          {montantNet.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)}
                      className="flex items-center gap-2 bg-[#1e2535]
                        border border-[#2e3a50] text-gray-400 px-4 py-3
                        rounded-xl hover:text-white transition">
                      <ChevronLeft size={16} /> Retour
                    </button>
                    <button
                      onClick={handleConfirmerMembre}
                      disabled={submitting || montantNet < 0}
                      className="flex-1 bg-green-600 hover:bg-green-700
                        text-white py-3 rounded-xl font-semibold
                        transition flex items-center justify-center
                        gap-2 disabled:opacity-50">
                      <Check size={16} />
                      {submitting ? 'Confirmation...'
                        : `Confirmer — ${montantNet
                            .toLocaleString('fr-FR')} F versé`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ÉTAPE 4 : Résumé final ── */}
          {step === 4 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-900/30 rounded-2xl
                  flex items-center justify-center mx-auto mb-3">
                  <Check size={32} className="text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Bénéfices confirmés !
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {resultats.length} membre(s) ont bouffé cette séance
                </p>
              </div>

              <div className="space-y-3 mb-4">
                {resultats.map((r, i) => (
                  <div key={i}
                    className="bg-[#1e2535] border border-green-800/30
                      rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-white font-semibold">
                          {r.membre.nom_complet}
                        </p>
                        <p className="text-xs text-gray-500">
                          Rang #{r.rang_beneficiaire}
                          · {selectedTontine?.nom}
                        </p>
                      </div>
                      <span className="text-green-400 font-mono
                        font-bold text-lg">
                        {parseFloat(r.montant_net)
                          .toLocaleString('fr-FR')} F
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-[#252d40] rounded-lg p-2
                        text-center">
                        <p className="text-gray-500">Brut</p>
                        <p className="text-white font-mono">
                          {parseFloat(r.montant_brut)
                            .toLocaleString('fr-FR')} F
                        </p>
                      </div>
                      <div className="bg-[#252d40] rounded-lg p-2
                        text-center">
                        <p className="text-gray-500">Déductions</p>
                        <p className="text-red-400 font-mono">
                          -{parseFloat(r.total_deductions)
                            .toLocaleString('fr-FR')} F
                        </p>
                      </div>
                      <div className="bg-[#252d40] rounded-lg p-2
                        text-center">
                        <p className="text-gray-500">Prêts</p>
                        <p className="text-amber-400 font-mono">
                          -{parseFloat(r.total_prets_deduits)
                            .toLocaleString('fr-FR')} F
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700
                  text-white py-3 rounded-xl font-semibold transition">
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MODAL SÉANCE COMPLÈTE ─────────────────────────────────────
function SeanceCompleteModal({ seanceId, membres, token, onClose }) {
  const [tab, setTab] = useState('ordre');
  const queryClient   = useQueryClient();

  // Ordre du jour
  const [nouveauPoint, setNouveauPoint] = useState('');

  // Nouvelles familiales
  const [membreNom, setMembreNom]       = useState('');
  const [memberId, setMemberId]         = useState('');
  const [typeNouvelle, setTypeNouvelle] = useState('autre');
  const [description, setDescription]  = useState('');

  // Divers
  const [contenuDivers, setContenuDivers] = useState('');
  const [auteurId, setAuteurId]           = useState('');

  const { data: ordreData, refetch: refetchOrdre } = useQuery({
    queryKey: ['ordre-du-jour', seanceId],
    queryFn: () => getOrdreJour(seanceId)
  });

  const { data: nouvellesData, refetch: refetchNouvelles } = useQuery({
    queryKey: ['nouvelles', seanceId],
    queryFn: () => getNouvellesSeance(seanceId)
  });

  const { data: diversData, refetch: refetchDivers } = useQuery({
    queryKey: ['divers', seanceId],
    queryFn: () => getDivers(seanceId)
  });

  const points   = ordreData?.points   || [];
  const nouvelles = nouvellesData?.nouvelles || [];
  const divers   = diversData?.divers   || [];

  // Points par défaut
  const pointsDefaut = [
    'Nouvelles familiales',
    'Rappel de la dernière séance',
    'Finances',
    'Divers'
  ];

  const handleAjouterPoint = async (point) => {
    try {
      await ajouterPoint({
        seance_id: seanceId,
        point,
        ordre: points.length + 1
      });
      toast.success('Point ajouté !');
      setNouveauPoint('');
      refetchOrdre();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleUpdatePoint = async (id, statut) => {
    try {
      await updatePoint(id, { statut });
      refetchOrdre();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const handleSupprimerPoint = async (id) => {
    try {
      await supprimerPoint(id);
      refetchOrdre();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const handleAjouterNouvelle = async (e) => {
    e.preventDefault();
    try {
      await ajouterNouvelle({
        seance_id:     seanceId,
        membre_nom:    membreNom,
        member_id:     memberId || undefined,
        type_nouvelle: typeNouvelle,
        description
      });
      toast.success('Nouvelle ajoutée !');
      setMembreNom('');
      setMemberId('');
      setDescription('');
      refetchNouvelles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleSupprimerNouvelle = async (id) => {
    try {
      await supprimerNouvelle(id);
      refetchNouvelles();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const handleAjouterDivers = async (e) => {
    e.preventDefault();
    try {
      await ajouterDivers({
        seance_id: seanceId,
        contenu:   contenuDivers,
        auteur_id: auteurId || undefined
      });
      toast.success('Point divers ajouté !');
      setContenuDivers('');
      refetchDivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const typeNouvelleColors = {
    deces:     { bg: 'bg-gray-900/40',   text: 'text-gray-400',   label: '⚫ Décès'     },
    naissance: { bg: 'bg-blue-900/40',   text: 'text-blue-400',   label: '👶 Naissance'  },
    mariage:   { bg: 'bg-pink-900/40',   text: 'text-pink-400',   label: '💍 Mariage'    },
    maladie:   { bg: 'bg-amber-900/40',  text: 'text-amber-400',  label: '🏥 Maladie'    },
    autre:     { bg: 'bg-purple-900/40', text: 'text-purple-400', label: '📌 Autre'      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center
      justify-center z-50">
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl
        p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            📋 Gestion de la séance
          </h2>
          <div className="flex items-center gap-3">
            {/* Bouton télécharger PV */}
            
              <a  href={`/api/v1/pv/${seanceId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-red-600
                hover:bg-red-700 text-white px-3 py-1.5 rounded-lg
                text-xs font-medium transition">
              📄 Télécharger PV
            </a>
            <button onClick={onClose}
              className="text-gray-400 hover:text-white transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1e2535] p-1 rounded-xl mb-4">
          {[
            ['ordre',    '📋 Ordre du jour'],
            ['nouvelles','👨‍👩‍👧 Nouvelles familiales'],
            ['divers',   '💬 Divers'],
          ].map(([key, label]) => (
            <button key={key}
              onClick={() => setTab(key)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs
                font-medium transition ${tab === key
                  ? 'bg-[#161b27] text-white shadow'
                  : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── ORDRE DU JOUR ── */}
          {tab === 'ordre' && (
            <div className="space-y-3">
              {/* Points par défaut */}
              <div>
                <p className="text-xs text-gray-500 font-mono
                  uppercase tracking-wider mb-2">
                  Points standards
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {pointsDefaut.map((p, i) => (
                    <button key={i}
                      onClick={() => handleAjouterPoint(p)}
                      className="bg-[#1e2535] border border-[#2e3a50]
                        text-gray-400 hover:text-white hover:border-blue-800/50
                        px-3 py-1.5 rounded-lg text-xs transition">
                      + {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ajouter un point personnalisé */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nouveauPoint}
                  onChange={e => setNouveauPoint(e.target.value)}
                  placeholder="Ajouter un point personnalisé..."
                  className="flex-1 bg-[#1e2535] border border-[#2e3a50]
                    rounded-xl px-4 py-2 text-white text-sm
                    placeholder-gray-600 focus:outline-none
                    focus:border-blue-500"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && nouveauPoint.trim()) {
                      handleAjouterPoint(nouveauPoint.trim());
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (nouveauPoint.trim()) {
                      handleAjouterPoint(nouveauPoint.trim());
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white
                    px-4 py-2 rounded-xl text-sm transition">
                  Ajouter
                </button>
              </div>

              {/* Liste des points */}
              {points.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  Aucun point ajouté — cliquez sur les points standards
                  ou ajoutez un point personnalisé
                </div>
              ) : (
                <div className="space-y-2">
                  {points.map((p, i) => (
                    <div key={p.id}
                      className={`flex items-center gap-3 rounded-xl
                        px-4 py-3 border transition ${
                        p.statut === 'traite'
                          ? 'bg-green-900/10 border-green-800/30'
                          : 'bg-[#1e2535] border-[#2e3a50]'}`}>
                      <span className="text-gray-500 font-mono
                        text-xs w-5">{i + 1}.</span>
                      <span className={`flex-1 text-sm ${
                        p.statut === 'traite'
                          ? 'text-green-400 line-through'
                          : 'text-white'}`}>
                        {p.point}
                      </span>
                      <div className="flex items-center gap-2">
                        {p.statut !== 'traite' ? (
                          <button
                            onClick={() =>
                              handleUpdatePoint(p.id, 'traite')}
                            className="text-xs bg-green-900/30
                              text-green-400 hover:bg-green-900/50
                              px-2 py-1 rounded-lg transition">
                            ✓ Traité
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleUpdatePoint(p.id, 'en_attente')}
                            className="text-xs bg-amber-900/30
                              text-amber-400 hover:bg-amber-900/50
                              px-2 py-1 rounded-lg transition">
                            ↩ Rouvrir
                          </button>
                        )}
                        <button
                          onClick={() => handleSupprimerPoint(p.id)}
                          className="text-gray-500 hover:text-red-400
                            transition">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── NOUVELLES FAMILIALES ── */}
          {tab === 'nouvelles' && (
            <div className="space-y-4">
              <form onSubmit={handleAjouterNouvelle}
                className="bg-[#1e2535] rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-white mb-2">
                  Ajouter une nouvelle
                </p>

                {/* Type de nouvelle */}
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(typeNouvelleColors).map(
                    ([key, val]) => (
                      <button key={key} type="button"
                        onClick={() => setTypeNouvelle(key)}
                        className={`p-2 rounded-lg text-xs text-center
                          transition border ${typeNouvelle === key
                            ? `${val.bg} ${val.text} border-current`
                            : 'bg-[#252d40] text-gray-500 border-transparent'}`}>
                        {val.label}
                      </button>
                    )
                  )}
                </div>

                {/* Membre */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Membre (optionnel)
                    </label>
                    <select value={memberId}
                      onChange={e => {
                        setMemberId(e.target.value);
                        const m = membres.find(
                          mb => mb.id === e.target.value
                        );
                        if (m) setMembreNom(m.nom_complet);
                      }}
                      className="w-full bg-[#252d40] border border-[#3a4960]
                        rounded-lg px-3 py-2 text-white text-sm
                        focus:outline-none focus:border-blue-500">
                      <option value="">Sélectionner...</option>
                      {membres.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nom_complet}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Nom (si non membre)
                    </label>
                    <input type="text" value={membreNom}
                      onChange={e => setMembreNom(e.target.value)}
                      placeholder="Nom de la personne"
                      className="w-full bg-[#252d40] border border-[#3a4960]
                        rounded-lg px-3 py-2 text-white text-sm
                        placeholder-gray-600 focus:outline-none
                        focus:border-blue-500"
                      required />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Description
                  </label>
                  <textarea value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ex: annonce les funérailles de sa cousine..."
                    rows={2}
                    className="w-full bg-[#252d40] border border-[#3a4960]
                      rounded-lg px-3 py-2 text-white text-sm
                      placeholder-gray-600 focus:outline-none
                      focus:border-blue-500 resize-none"
                    required />
                </div>

                <button type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700
                    text-white py-2 rounded-lg text-sm font-medium
                    transition flex items-center justify-center gap-2">
                  <Check size={14} /> Ajouter la nouvelle
                </button>
              </form>

              {/* Liste des nouvelles */}
              {nouvelles.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  Aucune nouvelle familiale enregistrée
                </div>
              ) : (
                <div className="space-y-2">
                  {nouvelles.map(n => {
                    const typeInfo = typeNouvelleColors[n.type_nouvelle]
                      || typeNouvelleColors.autre;
                    return (
                      <div key={n.id}
                        className={`flex items-start gap-3 rounded-xl
                          px-4 py-3 border ${typeInfo.bg}
                          border-current/20`}>
                        <span className={`text-sm font-mono
                          flex-shrink-0 ${typeInfo.text}`}>
                          {typeInfo.label.split(' ')[0]}
                        </span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium
                            ${typeInfo.text}`}>
                            {n.membre_nom}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {n.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSupprimerNouvelle(n.id)}
                          className="text-gray-500 hover:text-red-400
                            transition flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── DIVERS ── */}
          {tab === 'divers' && (
            <div className="space-y-4">
              <form onSubmit={handleAjouterDivers}
                className="bg-[#1e2535] rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-white mb-2">
                  Ajouter un point divers
                </p>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Auteur (optionnel)
                  </label>
                  <select value={auteurId}
                    onChange={e => setAuteurId(e.target.value)}
                    className="w-full bg-[#252d40] border border-[#3a4960]
                      rounded-lg px-3 py-2 text-white text-sm
                      focus:outline-none focus:border-blue-500">
                    <option value="">Sélectionner un membre...</option>
                    {membres.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nom_complet} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Contenu
                  </label>
                  <textarea value={contenuDivers}
                    onChange={e => setContenuDivers(e.target.value)}
                    placeholder="Ex: Le président encourage les membres à redoubler d'efforts..."
                    rows={3}
                    className="w-full bg-[#252d40] border border-[#3a4960]
                      rounded-lg px-3 py-2 text-white text-sm
                      placeholder-gray-600 focus:outline-none
                      focus:border-blue-500 resize-none"
                    required />
                </div>

                <button type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700
                    text-white py-2 rounded-lg text-sm font-medium
                    transition flex items-center justify-center gap-2">
                  <Check size={14} /> Ajouter
                </button>
              </form>

              {/* Liste divers */}
              {divers.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  Aucun point divers enregistré
                </div>
              ) : (
                <div className="space-y-2">
                  {divers.map(d => (
                    <div key={d.id}
                      className="bg-[#1e2535] border border-[#2e3a50]
                        rounded-xl px-4 py-3">
                      {d.auteur_nom && (
                        <p className="text-xs text-purple-400
                          font-medium mb-1">
                          {d.auteur_nom}
                        </p>
                      )}
                      <p className="text-sm text-gray-300">
                        {d.contenu}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
  const [showRubriques, setShowRubriques] = useState(false);
  const [showBouffer, setShowBouffer] = useState(false);
  const [showSeanceComplete, setShowSeanceComplete] = useState(false);

useEffect(() => {
  const checkSeanceOuverte = async () => {
    try {
      const res = await api.get('/seances/ouverte');
      if (res.data.seance) {
        const seance = res.data.seance;
        // Charger la caisse qui contient aussi les infos séance
        const caisseData = await getCaisse(seance.id);
        // Utiliser les données de la caisse pour activeSeance
        setActiveSeance(caisseData.seance);
        setCaisse(caisseData.caisse);
      }
    } catch(err) {
      console.log('Pas de séance ouverte :', err.message);
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
                  {/* Dans le bandeau vert, à côté du bouton Bilan & Clôture */}
                  <button
                    onClick={() => setShowSeanceComplete(true)}
                    className="flex items-center gap-2 bg-blue-600
                      hover:bg-blue-700 text-white px-4 py-2 rounded-lg
                      text-sm font-medium transition">
                    📋 Ordre du jour & Nouvelles
                  </button>


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
              <div className="grid grid-cols-5 gap-4 mb-6">
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

                <button onClick={() => {
                      console.log('🔴 Clic Épargne & Prêts détecté !');
                      console.log('activeSeance:', activeSeance);
                      console.log('showRubriques avant:', showRubriques);
                      setShowRubriques(true);
                      console.log('showRubriques après setShowRubriques(true)');
                    }}
                      className="bg-[#161b27] border border-[#2e3a50]
                        hover:border-purple-800/50 rounded-xl p-5 text-left
                        transition group">
                      <div className="w-10 h-10 bg-purple-900/30 rounded-xl
                        flex items-center justify-center mb-3
                        group-hover:bg-purple-900/50 transition">
                        <CreditCard size={18} className="text-purple-400" />
                      </div>
                      <p className="text-white font-medium">Épargne & Prêts</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Banque · Fond · GAV · Remboursements
                      </p>
                    </button>

                    <button onClick={() => setShowBouffer(true)}
                        className="bg-[#161b27] border border-[#2e3a50]
                          hover:border-green-800/50 rounded-xl p-5 text-left
                          transition group">
                        <div className="w-10 h-10 bg-green-900/30 rounded-xl
                          flex items-center justify-center mb-3
                          group-hover:bg-green-900/50 transition">
                          <span className="text-2xl">🎉</span>
                        </div>
                        <p className="text-white font-medium">Bouffer</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Désigner le(s) bénéficiaire(s)
                        </p>
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
        {/* À côté du bouton Eye dans l'historique */}

          <a href={`/api/v1/pv/${s.id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => {
            // Ajouter le token dans le header via fetch
            e.preventDefault();
            const token = localStorage.getItem('token');
            fetch(`/api/v1/pv/${s.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => res.blob())
            .then(blob => {
              const url = URL.createObjectURL(blob);
              const a   = document.createElement('a');
              a.href    = url;
              a.download = `PV_Seance_${s.numero}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            })
            .catch(() => toast.error('Erreur téléchargement PDF'));
          }}
          className="flex items-center gap-2 bg-red-900/30
            text-red-400 hover:bg-red-900/50 px-3 py-1.5
            rounded-lg text-xs font-medium transition">
          📄 PDF
        </a>
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

      {showBouffer && activeSeance && (
        <BoufferModal
          seanceId={activeSeance.id}
          membres={membres}
          tontines={tontines}
          onClose={() => setShowBouffer(false)}
          onDone={() => {
            refreshCaisse(activeSeance.id);
            setShowBouffer(false);
          }}
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

      {showSeanceComplete && activeSeance && (
        <SeanceCompleteModal
          seanceId={activeSeance.id}
          membres={membres}
          token={localStorage.getItem('token')}
          onClose={() => setShowSeanceComplete(false)}
        />
      )}


      {/* Modal Rubriques Financières */}
      {showRubriques && activeSeance && activeSeance.id && (
        <RubriquesModal
          seanceId={activeSeance.id}
          membres={membres}
          onClose={() => setShowRubriques(false)}
          onDone={() => refreshCaisse(activeSeance.id)}
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