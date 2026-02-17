import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AccountabilityInfoProps {
  created_by?: string | null;
  created_at?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
  className?: string;
}

export function AccountabilityInfo({
  created_by,
  created_at,
  updated_by,
  updated_at,
  className = "",
}: AccountabilityInfoProps) {
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [updaterName, setUpdaterName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserNames = async () => {
      const userIds = [created_by, updated_by].filter(Boolean) as string[];
      if (userIds.length === 0) return;

      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('users')
          .select('user_id, name')
          .in('user_id', userIds);

        if (!error && data) {
          if (created_by) {
            const creator = data.find((u: any) => u.user_id === created_by);
            setCreatorName(creator?.name || 'Unknown User');
          }
          if (updated_by) {
            const updater = data.find((u: any) => u.user_id === updated_by);
            setUpdaterName(updater?.name || 'Unknown User');
          }
        }
      } catch (error) {
        console.error('Error fetching user names:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserNames();
  }, [created_by, updated_by]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  const hasInfo = created_by || created_at || updated_by || updated_at;

  if (!hasInfo) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors ${className}`}
          aria-label="View accountability information"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 text-sm" align="start">
        <div className="space-y-2">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Created
            </div>
            {loading ? (
              <div className="text-slate-400">Loading...</div>
            ) : (
              <>
                {creatorName && (
                  <div className="text-slate-700">By: {creatorName}</div>
                )}
                {created_at && (
                  <div className="text-slate-500 text-xs">
                    {formatDate(created_at)}
                  </div>
                )}
              </>
            )}
          </div>
          {(updated_by || updated_at) && (
            <div className="pt-2 border-t">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Last Updated
              </div>
              {loading ? (
                <div className="text-slate-400">Loading...</div>
              ) : (
                <>
                  {updaterName && (
                    <div className="text-slate-700">By: {updaterName}</div>
                  )}
                  {updated_at && (
                    <div className="text-slate-500 text-xs">
                      {formatDate(updated_at)}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

