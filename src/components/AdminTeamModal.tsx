import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Mail,
  Crown,
  Users,
  ShieldCheck,
  Info
} from 'lucide-react';
import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  AdminMember,
  getAuthorizedAdminsList,
  addAuthorizedAdmin,
  removeAuthorizedAdmin,
  AdminAuthState
} from '../firebase';

interface AdminTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  authState: AdminAuthState;
}

export const AdminTeamModal: React.FC<AdminTeamModalProps> = ({
  isOpen,
  onClose,
  authState
}) => {
  const [adminList, setAdminList] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const list = await getAuthorizedAdminsList();
      setAdminList(list);
    } catch (err) {
      console.warn('Could not fetch admin list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdmins();
      setError(null);
      setSuccess(null);
      setNewEmail('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const clean = newEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (adminList.some((a) => a.email.toLowerCase() === clean)) {
      setError('This email is already in the authorized Admin Team list.');
      return;
    }

    setActionLoading(true);
    try {
      await addAuthorizedAdmin(clean, authState.user?.email || 'Authorized Lead');
      setSuccess(`Successfully added "${clean}" to authorized Admin whitelist!`);
      setNewEmail('');
      await fetchAdmins();
    } catch (err: any) {
      setError(err?.message || 'Failed to authorize admin. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (adminId: string, email: string) => {
    if (email.toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase()) {
      setError('Cannot remove the primary super admin account.');
      return;
    }

    if (!confirm(`Are you sure you want to revoke Admin privileges for ${email}?`)) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await removeAuthorizedAdmin(adminId, email);
      setSuccess(`Admin privileges revoked for ${email}.`);
      await fetchAdmins();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove admin.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2B22]/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#F4F1E6] border-4 border-[#1E2B22] shadow-[8px_8px_0px_0px_rgba(30,43,34,1)] rounded-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#1E2B22] text-[#EDEEE8] p-4 flex items-center justify-between border-b-4 border-[#E8A93A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#E8A93A] text-[#1E2B22] p-1.5 rounded">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-oswald font-black text-lg sm:text-xl uppercase tracking-wide text-white leading-none">
                Admin Team & RBAC Authorizations
              </h3>
              <p className="font-mono-plex text-[10px] text-[#E8A93A] tracking-wider uppercase font-semibold">
                Manage Authorized Hostel Wardens & Committee Leads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded hover:bg-[#2B3A2E] text-[#D9DBD1] hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 font-sans">
          {/* Security Banner */}
          <div className="bg-[#1E2B22] text-[#EDEEE8] p-4 rounded-xl border-2 border-[#E8A93A] text-xs font-mono-plex space-y-1.5">
            <div className="flex items-center gap-2 text-[#E8A93A] font-bold">
              <Info className="w-4 h-4" />
              <span>Strict Role-Based Access Control (RBAC)</span>
            </div>
            <p className="text-[#C9CDC5] leading-relaxed">
              Only emails listed here have permission to access the <strong>Admin Dashboard</strong> and query the raw <code>feedbacks</code> collection from Cloud Firestore. Unlisted students are strictly blocked at the database rule layer.
            </p>
          </div>

          {/* Feedback & Alert Messages */}
          {error && (
            <div className="bg-[#B5484D]/10 border-2 border-[#B5484D] text-[#B5484D] p-3 rounded-xl flex items-start gap-2.5 text-xs font-mono-plex">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-[#5C8A56]/15 border-2 border-[#5C8A56] text-[#1E2B22] p-3 rounded-xl flex items-start gap-2.5 text-xs font-mono-plex font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5C8A56] mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Add New Admin Form */}
          <div className="bg-white border-2 border-[#1E2B22] rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(30,43,34,1)]">
            <h4 className="font-oswald font-bold uppercase text-sm text-[#1E2B22] mb-2.5 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#E8A93A]" />
              <span>Authorize New Hostel Admin / Warden</span>
            </h4>
            <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#585B52]" />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="warden.incharge@hostel.edu"
                  className="w-full bg-[#F4F1E6] border-2 border-[#1E2B22] rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm font-mono-plex text-[#1E2B22] placeholder:text-[#888B80] focus:outline-hidden focus:border-[#E8A93A]"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading || !newEmail.trim()}
                className="bg-[#1E2B22] hover:bg-[#2B3A2E] text-white border-2 border-[#1E2B22] font-oswald font-bold uppercase tracking-wider text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(232,169,58,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60 shrink-0"
              >
                {actionLoading ? 'Saving...' : 'Authorize Admin'}
              </button>
            </form>
          </div>

          {/* Current Authorized Admin List */}
          <div className="space-y-2">
            <h4 className="font-oswald font-bold uppercase text-sm text-[#1E2B22] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#E8A93A]" />
                <span>Authorized Admin Accounts ({adminList.length})</span>
              </span>
              {loading && <span className="font-mono-plex text-xs text-[#585B52] lowercase animate-pulse">refreshing...</span>}
            </h4>

            <div className="space-y-2">
              {adminList.map((admin) => {
                const isSuper = admin.email.toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase() || admin.role === 'super_admin';
                return (
                  <div
                    key={admin.uid || admin.email}
                    className="bg-white border-2 border-[#1E2B22] rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSuper ? 'bg-[#E8A93A] text-[#1E2B22]' : 'bg-[#EDEEE8] text-[#1E2B22]'}`}>
                        {isSuper ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-plex text-xs sm:text-sm font-bold text-[#1E2B22]">
                            {admin.email}
                          </span>
                          {isSuper ? (
                            <span className="bg-[#E8A93A]/20 border border-[#E8A93A] text-[#1E2B22] text-[10px] font-mono-plex font-bold px-1.5 py-0.5 rounded uppercase">
                              Super Admin
                            </span>
                          ) : (
                            <span className="bg-[#EDEEE8] border border-[#1E2B22]/30 text-[#585B52] text-[10px] font-mono-plex font-semibold px-1.5 py-0.5 rounded uppercase">
                              Hostel Admin
                            </span>
                          )}
                        </div>
                        <p className="font-mono-plex text-[10px] text-[#585B52] mt-0.5">
                          Authorized on {new Date(admin.addedAt).toLocaleDateString()} by {admin.addedBy || 'Admin'}
                        </p>
                      </div>
                    </div>

                    {!isSuper && (
                      <button
                        onClick={() => handleRemove(admin.uid, admin.email)}
                        disabled={actionLoading}
                        className="p-1.5 text-[#B5484D] hover:bg-[#B5484D]/10 rounded border border-transparent hover:border-[#B5484D] transition-colors cursor-pointer"
                        title="Revoke Admin access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#EDEEE8] border-t-2 border-[#1E2B22] p-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1E2B22] text-white rounded-lg font-oswald text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-[#2B3A2E] transition-all"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};
