import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Clock, AlertCircle } from 'lucide-react';

type PrefItem = {
  course_id: string;
  rank: number;
  course_name: string | null;
  credits: number | null;
  faculty: string | null;
  slot: string | null;
  course_type?: string | null;
  elective_slot?: string | null;
  max_choices?: number | null;
};

type PreferencesResponse = {
  preferences: PrefItem[];
  deadline: string | null;
  can_edit: boolean;
};

export function MyPreferences() {
  const { accessToken } = useAuth();
  const [prefs, setPrefs] = useState<PrefItem[]>([]);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!accessToken) return;
    setLoading(true);
    api<PreferencesResponse>('/preferences', { token: accessToken })
      .then((data) => {
        setPrefs(data.preferences);
        setDeadline(data.deadline);
        setCanEdit(data.can_edit);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const diff = deadlineTime - now;
      if (diff <= 0) {
        setTimeRemaining('Deadline passed');
        setCanEdit(false);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const moveUp = (index: number) => {
    if (index === 0 || !canEdit) return;
    const newPrefs = [...prefs];
    [newPrefs[index - 1], newPrefs[index]] = [newPrefs[index], newPrefs[index - 1]];
    newPrefs[index - 1].rank = index;
    newPrefs[index].rank = index + 1;
    setPrefs(newPrefs);
  };

  const moveDown = (index: number) => {
    if (index === prefs.length - 1 || !canEdit) return;
    const newPrefs = [...prefs];
    [newPrefs[index], newPrefs[index + 1]] = [newPrefs[index + 1], newPrefs[index]];
    newPrefs[index].rank = index + 1;
    newPrefs[index + 1].rank = index + 2;
    setPrefs(newPrefs);
  };

  const remove = (index: number) => {
    if (!canEdit) return;
    const newPrefs = prefs.filter((_, i) => i !== index).map((p, i) => ({ ...p, rank: i + 1 }));
    setPrefs(newPrefs);
  };

  const save = async () => {
    if (!accessToken || !canEdit) return;
    setSaving(true);
    setError('');
    try {
      await api('/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences: prefs }),
        token: accessToken,
      });
      setError('');
      alert('Preferences saved successfully!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Course Preferences</h1>
        <p className="text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            My Course Preferences
          </h1>
          <p className="text-muted-foreground mt-1">Manage your course selection preferences</p>
        </div>
      </div>

      {deadline && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">Preference Deadline</p>
                <p className="text-sm text-amber-700 mt-1">
                  {deadline ? `Deadline: ${new Date(deadline).toLocaleString()}` : 'No deadline set'}
                  {timeRemaining && ` · ${timeRemaining} remaining`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!canEdit && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">
                Preferences are locked. You cannot edit them at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}

      {prefs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">No preferences added yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Go to Available Courses to add courses to your preferences
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Preferences ({prefs.length})</span>
                {canEdit && (
                  <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prefs.map((pref, index) => (
                  <div
                    key={`${pref.course_id}-${pref.rank}`}
                    className="flex items-center gap-4 p-4 rounded-lg border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            ↑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveDown(index)}
                            disabled={index === prefs.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            ↓
                          </Button>
                        </>
                      )}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                        {pref.rank}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-700">{pref.course_id}</span>
                        <span className="font-medium">{pref.course_name || 'N/A'}</span>
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        {pref.credits && <span>{pref.credits} credits</span>}
                        {pref.faculty && <span>{pref.faculty}</span>}
                        {pref.slot && <span>{pref.slot}</span>}
                      </div>
                    </div>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
