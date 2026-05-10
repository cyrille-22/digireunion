import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestOTP, verifyOTP } from '../../api/auth';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [step, setStep] = useState(1);
  const [telephone, setTelephone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestOTP(telephone);
      toast.success('Code OTP envoyé !');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyOTP(telephone, code);
      login(res.data.token, res.data.membre);
      toast.success(`Bienvenue ${res.data.membre.nom} !`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Digi-Réunion</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Plateforme de gestion des tontines
          </p>
        </div>

        <div className="bg-[#161b27] border border-[#2e3a50] rounded-2xl p-8">

          {step === 1 ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">
                Connexion
              </h2>
              <form onSubmit={handleRequestOTP}>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+237690000001"
                    className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Envoi...' : 'Recevoir le code OTP'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">
                Entrez votre code
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Code envoyé au {telephone}
              </p>
              <form onSubmit={handleVerifyOTP}>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    Code OTP à 6 chiffres
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full bg-[#1e2535] border border-[#2e3a50] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Vérification...' : 'Se connecter'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full mt-3 text-gray-400 hover:text-white text-sm transition"
                >
                  Changer de numéro
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}