import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/utils/demoMode';

export const usePaymentSplits = (activeDraftVersionId: string | null) => {
  const [paymentSplits, setPaymentSplits] = useState<number[]>([40, 30, 20, 10]);

  useEffect(() => {
    const fetchPaymentSplits = async () => {
      if (!activeDraftVersionId) {
        // Reset to defaults if no version
        setPaymentSplits([40, 30, 20, 10]);
        return;
      }

      if (isDemoMode()) {
        // In demo mode, get payment splits from mock versions
        try {
          const { getMockProjectVersions } = await import('@/utils/mockData');
          const mockVersions = getMockProjectVersions();
          const version = mockVersions.find(v => v.version_id === activeDraftVersionId);
          if (version) {
            setPaymentSplits([
              version.payment_1_percentage !== null ? Number(version.payment_1_percentage) : 40,
              version.payment_2_percentage !== null ? Number(version.payment_2_percentage) : 30,
              version.payment_3_percentage !== null ? Number(version.payment_3_percentage) : 20,
              version.payment_4_percentage !== null ? Number(version.payment_4_percentage) : 10
            ]);
          } else {
            setPaymentSplits([40, 30, 20, 10]);
          }
        } catch (error) {
          console.error('Error fetching payment splits:', error);
        }
        return;
      }

      try {
        // COMMENTED OUT IN DEMO MODE - using mock data instead
        const { data: versionData } = await supabase
          .from('project_versions')
          .select('payment_1_percentage, payment_2_percentage, payment_3_percentage, payment_4_percentage')
          .eq('version_id', activeDraftVersionId)
          .single();

        if (versionData) {
          setPaymentSplits([
            versionData.payment_1_percentage !== null ? Number(versionData.payment_1_percentage) : 40,
            versionData.payment_2_percentage !== null ? Number(versionData.payment_2_percentage) : 30,
            versionData.payment_3_percentage !== null ? Number(versionData.payment_3_percentage) : 20,
            versionData.payment_4_percentage !== null ? Number(versionData.payment_4_percentage) : 10
          ]);
        }
      } catch (error) {
        console.error('Error fetching payment splits:', error);
      }
    };

    fetchPaymentSplits();
  }, [activeDraftVersionId]);

  return paymentSplits;
};

