import { useState } from 'react';
import { Smartphone, AlertCircle } from 'lucide-react';
import { Button, Card, PhoneInput } from './ui';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useToast } from './ui/Toast';

interface GoogleProfileCompletionProps {
  onComplete: () => void;
}

export default function GoogleProfileCompletion({ onComplete }: GoogleProfileCompletionProps) {
  const { t } = useTranslation();
  const { completeProfile } = useAuth();
  const toast = useToast();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!phone) {
      setError(t('auth.phoneRequired') || 'Phone number is required');
      return;
    }
    setLoading(true);
    setError('');
    const result = await completeProfile(phone, UserRole.USER);
    setLoading(false);
    if (!result.ok) {
      const msg = result.error || t('auth.profileCompleteFailed') || 'Failed to complete profile';
      setError(msg);
      return;
    }
    toast.success(t('auth.welcome') || 'Welcome!', t('auth.profileCompleteSuccess') || 'Your profile is complete');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5" style={{ background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-[480px]">
        <Card padding="lg">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F4F4F5, #E4E4E7)' }}>
              <Smartphone size={24} color="#1D4ED8" />
            </div>
            <h2 className="font-[var(--font-body)] text-xl font-bold text-[var(--text)]">
              {t('auth.completeProfile') || 'Complete Your Profile'}
            </h2>
            <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-1.5">
              {t('auth.completeProfileDesc') || 'Please provide your phone number to continue.'}
            </p>
          </div>

          <div className="space-y-5">
            <PhoneInput
              label={t('auth.phoneNumber') || 'Phone Number'}
              value={phone}
              onChange={setPhone}
              required
            />

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-md" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                <p className="font-[var(--font-body)] text-xs font-medium" style={{ color: '#DC2626' }}>{error}</p>
              </div>
            )}

            <Button fullWidth loading={loading} onClick={handleSubmit}>
              {t('auth.continue') || 'Continue'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
