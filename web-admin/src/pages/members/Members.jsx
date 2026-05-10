import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMembers, addMember, updateMember, deleteMember } from '../../api/members';
import toast from 'react-hot-toast';
import { UserPlus, Pencil, Trash2, X, Check } from 'lucide-react';

const ROLES = ['president','vice_president','secretaire','tresorier','cac','censeur','membre'];

const roleColors = {
  president:      'bg-blue-900/40 text-blue-400',
  vice_president: 'bg-teal-900/40 text-teal-400',
  secretaire:     'bg-green-900/40 text-green-400',
  tresorier:      'bg-amber-900/40 text-amber-400',
  cac:            'bg-purple-900/40 text-purple-400',
  censeur:        'bg-red-900/40 text-red-400',
  membre:         'bg-gray-800 text-gray-400',
};

// ── MODAL AJOUT / MODIFICATION ────────────────────────────────
function MembreModal({ membre, onClose, onSave }) {
  const [form, setForm] = useState({
    nom_complet: membre?.nom_complet || '',
    telephone:   membre?.telephone   || '',
    role:        membre?.role        || 'membre',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-6 w-full max-w-md">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {membre ? 'Modifier le membre' : 'Ajouter un membre'}
          </h2>
          <button onClick={onClose}
            className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nom complet */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              value={form.nom_complet}
              onChange={e => setForm({...form, nom_complet: e.target.value})}
              placeholder="Ex: Jean Kotto"
              className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Téléphone */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={form.telephone}
              onChange={e => setForm({...form, telephone: e.target.value})}
              placeholder="+237690000001"
              disabled={!!membre}
              className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              required
            />
            {membre && (
              <p className="text-xs text-gray-500 mt-1">
                Le téléphone ne peut pas être modifié
              </p>
            )}
          </div>

          {/* Rôle */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              Rôle dans l'association
            </label>
            <select
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1e2535] border border-[#2e3a50] text-gray-400 py-3 rounded-xl hover:text-white transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              <Check size={16} />
              {membre ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────
export default function Members() {
  const [showModal, setShowModal] = useState(false);
  const [selectedMembre, setSelectedMembre] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers().then(r => r.data)
  });

  const addMutation = useMutation({
    mutationFn: (data) => addMember(data),
    onSuccess: () => {
      toast.success('Membre ajouté avec succès !');
      queryClient.invalidateQueries(['members']);
      setShowModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateMember(id, data),
    onSuccess: () => {
      toast.success('Membre mis à jour !');
      queryClient.invalidateQueries(['members']);
      setShowModal(false);
      setSelectedMembre(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteMember(id),
    onSuccess: () => {
      toast.success('Membre sorti de l\'association');
      queryClient.invalidateQueries(['members']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  });

  const handleSave = (form) => {
    if (selectedMembre) {
      updateMutation.mutate({ id: selectedMembre.id, data: form });
    } else {
      addMutation.mutate(form);
    }
  };

  const handleEdit = (membre) => {
    setSelectedMembre(membre);
    setShowModal(true);
  };

  const handleDelete = (membre) => {
    if (confirm(`Confirmer la sortie de ${membre.nom_complet} ?`)) {
      deleteMutation.mutate(membre.id);
    }
  };

  const membres = data?.membres || [];
  const filtered = membres.filter(m =>
    m.nom_complet.toLowerCase().includes(search.toLowerCase()) ||
    m.telephone.includes(search) ||
    m.role.includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Membres</h1>
          <p className="text-gray-400 text-sm mt-1">
            {membres.length} membres dans l'association
          </p>
        </div>
        <button
          onClick={() => { setSelectedMembre(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition"
        >
          <UserPlus size={16} />
          Ajouter un membre
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, téléphone ou rôle..."
          className="w-full bg-[#161b27] border border-[#2e3a50] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {['president','secretaire','tresorier','membre'].map(role => (
          <div key={role}
            className="bg-[#161b27] border border-[#2e3a50] rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">
              {membres.filter(m => m.role === role).length}
            </p>
            <p className="text-xs text-gray-500 capitalize mt-1">{role}</p>
          </div>
        ))}
      </div>

      {/* Tableau des membres */}
      <div className="bg-[#161b27] border border-[#2e3a50] rounded-xl overflow-hidden">

        {/* En-tête tableau */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-[#1e2535] text-xs text-gray-500 font-mono uppercase tracking-wider">
          <div className="col-span-3">Nom</div>
          <div className="col-span-2">Téléphone</div>
          <div className="col-span-2">Rôle</div>
          <div className="col-span-1">Score</div>
          <div className="col-span-2">GAV</div>
          <div className="col-span-1">Statut</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Lignes */}
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Aucun membre trouvé
          </div>
        ) : (
          filtered.map(m => (
            <div key={m.id}
              className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-[#2e3a50] last:border-0 items-center hover:bg-[#1e2535]/50 transition"
            >
              {/* Nom */}
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {m.nom_complet.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <span className="text-white text-sm font-medium truncate">
                  {m.nom_complet}
                </span>
              </div>

              {/* Téléphone */}
              <div className="col-span-2 text-gray-400 font-mono text-xs">
                {m.telephone}
              </div>

              {/* Rôle */}
              <div className="col-span-2">
                <span className={`px-2 py-1 rounded-md text-xs font-mono font-medium ${roleColors[m.role] || 'bg-gray-800 text-gray-400'}`}>
                  {m.role}
                </span>
              </div>

              {/* Score */}
              <div className="col-span-1">
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-mono font-bold
                    ${m.score_fiabilite >= 80 ? 'text-green-400' :
                      m.score_fiabilite >= 60 ? 'text-amber-400' :
                      'text-red-400'}`}>
                    {m.score_fiabilite}
                  </span>
                  <span className="text-xs text-gray-600">/100</span>
                </div>
              </div>

              {/* GAV */}
              <div className="col-span-2 text-white font-mono text-sm">
                {parseFloat(m.gav_solde).toLocaleString('fr-FR')} F
              </div>

              {/* Statut */}
              <div className="col-span-1">
                <span className={`px-2 py-1 rounded-md text-xs font-mono
                  ${m.statut === 'actif'
                    ? 'bg-green-900/40 text-green-400'
                    : 'bg-red-900/40 text-red-400'}`}>
                  {m.statut}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center gap-2">
                <button
                  onClick={() => handleEdit(m)}
                  className="text-gray-400 hover:text-blue-400 transition"
                  title="Modifier"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(m)}
                  className="text-gray-400 hover:text-red-400 transition"
                  title="Sortie"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <MembreModal
          membre={selectedMembre}
          onClose={() => { setShowModal(false); setSelectedMembre(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}